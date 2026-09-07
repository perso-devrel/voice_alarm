package com.alarmtalk.app.data

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * 사용 기록에 **어느 계정을 적는가**.
 *
 * 서버는 토큰의 주인으로 기록하므로, A 가 남긴 사건이 B 의 기록으로 올라가면 되돌릴 방법이
 * 없다. 그래서 계정은 **적는 순간**에 정해져야 한다 — 코루틴이 실제로 도는 시점이 아니라.
 * iOS `UsageEventQueueTests` 의 같은 이름 테스트와 한 쌍이다.
 */
class UsageEventRecorderAccountTest {

    @Test
    fun `계정은 적는 순간에 정해진다`() {
        val dao = FakeUsageEventDao()
        var current: String? = "u1"
        var reads = 0
        val recorder = UsageEventRecorder(dao) { reads++; current }

        recorder.record(type = UsageEvents.ALARM_RANG, alarmId = "a")

        // 코루틴 안에서 읽으면 이 시점에 아직 0이다 — 그 틈에 계정이 바뀌면 남의 기록이 된다.
        assertEquals(1, reads)

        current = "u2"
        dao.awaitInsert()
        assertEquals("u1", dao.inserted.single().userId)
    }

    private class FakeUsageEventDao : UsageEventDao {
        val inserted = mutableListOf<UsageEventEntity>()

        override suspend fun insert(event: UsageEventEntity) {
            synchronized(inserted) { inserted += event }
        }

        override suspend fun oldest(userId: String, limit: Int): List<UsageEventEntity> =
            synchronized(inserted) { inserted.filter { it.userId == null || it.userId == userId } }

        override suspend fun deleteByIds(ids: List<String>) {
            synchronized(inserted) { inserted.removeAll { it.id in ids } }
        }

        override suspend fun count(): Int = synchronized(inserted) { inserted.size }

        override suspend fun deleteOldest(count: Int) {
            synchronized(inserted) { repeat(minOf(count, inserted.size)) { inserted.removeAt(0) } }
        }

        /** 기록은 Dispatchers.IO 로 나가므로 값이 보일 때까지 짧게 기다린다. */
        fun awaitInsert() = runBlocking {
            val deadline = System.currentTimeMillis() + 2_000
            while (synchronized(inserted) { inserted.isEmpty() }) {
                if (System.currentTimeMillis() > deadline) error("기록이 들어오지 않았다")
                Thread.sleep(10)
            }
        }
    }
}
