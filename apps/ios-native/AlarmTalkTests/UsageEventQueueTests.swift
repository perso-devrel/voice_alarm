import Foundation
import Testing
@testable import AlarmTalk

/// 사용 기록 큐 — **오프라인에서 쌓았다가 성공한 것만 지운다** 는 계약을 지킨다.
struct UsageEventQueueTests {
    /// 로그인 계정은 **주입한다** — 테스트가 기기의 진짜 키체인을 읽지 않게.
    private func makeQueue(currentUserID: String? = "u1") -> (UsageEventQueue, URL) {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("usage-events-\(UUID().uuidString).json")
        return (UsageEventQueue(fileURL: url, currentUserID: { currentUserID }), url)
    }

    @Test("적은 순서대로 꺼낸다 — 오래된 것이 먼저 간다")
    func ordersOldestFirst() throws {
        let (queue, url) = makeQueue()
        defer { try? FileManager.default.removeItem(at: url) }
        let now = Date()
        queue.record(.alarmCreated, alarmID: "a", userID: "u1", occurredAt: now)
        queue.record(.alarmRang, alarmID: "b", userID: "u1", occurredAt: now.addingTimeInterval(-60))
        // 파일 쓰기는 비동기 큐라 값이 보일 때까지 기다린다.
        try waitUntil { queue.count == 2 }

        let batch = queue.oldest(userID: "u1", limit: 10)
        #expect(batch.map(\.alarmID) == ["b", "a"])
    }

    @Test("성공한 것만 지운다 — 실패한 배치는 그대로 남아 다시 간다")
    func removesOnlyAcknowledged() throws {
        let (queue, url) = makeQueue()
        defer { try? FileManager.default.removeItem(at: url) }
        queue.record(.alarmCreated, alarmID: "a", userID: "u1")
        queue.record(.alarmDeleted, alarmID: "b", userID: "u1")
        try waitUntil { queue.count == 2 }

        let batch = queue.oldest(userID: "u1", limit: 10)
        queue.remove(ids: [batch[0].id])
        try waitUntil { queue.count == 1 }
        #expect(queue.oldest(userID: "u1", limit: 10).first?.id == batch[1].id)
    }

    @Test("다른 계정의 기록은 보내지 않는다 — 서버는 토큰의 주인으로 적는다")
    func filtersByAccount() throws {
        let (queue, url) = makeQueue()
        defer { try? FileManager.default.removeItem(at: url) }
        queue.record(.alarmCreated, alarmID: "mine", userID: "u1")
        queue.record(.alarmCreated, alarmID: "theirs", userID: "u2")
        try waitUntil { queue.count == 2 }

        let batch = queue.oldest(userID: "u1", limit: 10)
        #expect(batch.map(\.alarmID) == ["mine"])
    }

    @Test("계정을 안 넘겨도 그때의 계정에 묶인다 — 울림·삭제 경로가 빠뜨리지 못한다")
    func bindsCurrentAccountWithoutExplicitUserID() throws {
        let (queue, url) = makeQueue(currentUserID: "u1")
        defer { try? FileManager.default.removeItem(at: url) }
        // 울림·삭제 경로는 계정을 넘기지 않는다. 그래도 u1 것이어야 한다 —
        // 비어 있으면 다음에 로그인한 u2 의 기록으로 올라간다(서버가 토큰 주인으로 적는다).
        queue.record(.alarmRang, alarmID: "a")
        try waitUntil { queue.count == 1 }

        #expect(queue.oldest(userID: "u2", limit: 10).isEmpty)
        #expect(queue.oldest(userID: "u1", limit: 10).first?.alarmID == "a")
    }

    @Test("넘긴 계정이 이긴다 — 편집기는 메모리에 든 세션을 쓴다")
    func explicitUserIDWins() throws {
        let (queue, url) = makeQueue(currentUserID: "u1")
        defer { try? FileManager.default.removeItem(at: url) }
        queue.record(.alarmCreated, alarmID: "b", userID: "u9")
        try waitUntil { queue.count == 1 }

        #expect(queue.oldest(userID: "u1", limit: 10).isEmpty)
        #expect(queue.oldest(userID: "u9", limit: 10).first?.alarmID == "b")
    }

    @Test("자유 문자열은 길이를 자른다 — 이벤트는 식별자만 나른다")
    func trimsDetail() throws {
        let (queue, url) = makeQueue()
        defer { try? FileManager.default.removeItem(at: url) }
        queue.record(.alarmSnoozed, alarmID: "a", detail: String(repeating: "x", count: 300), userID: "u1")
        try waitUntil { queue.count == 1 }
        #expect(queue.oldest(userID: "u1", limit: 1).first?.detail?.count == 120)
    }

    /// 파일 쓰기가 비동기라 값이 보일 때까지 짧게 기다린다.
    private func waitUntil(_ condition: () -> Bool, timeout: TimeInterval = 2) throws {
        let deadline = Date().addingTimeInterval(timeout)
        while !condition() {
            if Date() > deadline { throw TestFailure.timedOut }
            usleep(20_000)
        }
    }

    private enum TestFailure: Error { case timedOut }
}
