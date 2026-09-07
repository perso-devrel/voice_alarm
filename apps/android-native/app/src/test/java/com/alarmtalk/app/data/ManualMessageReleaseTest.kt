package com.alarmtalk.app.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * 알람을 **고쳐서** 직접 입력 문구를 놓았을 때 '비사용중' 을 적는 판정.
 *
 * 안 적으면 그 문구가 서버 보관함에서 영원히 '사용중' 으로 남는다(해제를 적는 곳이
 * 삭제 경로 하나뿐이었다). 반대로 너무 많이 적으면 더 나쁘다 — 붙어 있는 문구가
 * 비사용중으로 뒤집힌다. 그 경계를 여기서 고정한다.
 */
class ManualMessageReleaseTest {

    @Test
    fun `문구를 바꾸면 앞 문구를 놓아 준다`() {
        val released = manualMessageReleasedByEdit(alarm(messageId = "m-old"), alarm(messageId = "m-new"))
        assertEquals("m-old", released)
    }

    @Test
    fun `알람 전용이나 랜덤 문구로 바꿔 문구가 사라져도 놓아 준다`() {
        val released = manualMessageReleasedByEdit(alarm(messageId = "m-old"), alarm(messageId = null))
        assertEquals("m-old", released)
    }

    @Test
    fun `같은 문구면 오디오를 다시 만들어도 놓지 않는다`() {
        // ⚠ 여기서 해제를 적으면 해제와 붙임이 **같은 밀리초**에 찍힐 수 있고, 업로드
        // 정렬은 시각 하나뿐이라 순서가 뒤집힌다. 서버는 `in_use_updated_at <= ?` 로
        // 늦게 온 해제를 받아들여, **붙어 있는 문구를 비사용중으로** 만든다.
        val released = manualMessageReleasedByEdit(
            alarm(messageId = "m-same", cacheKey = "key-old"),
            alarm(messageId = "m-same", cacheKey = "key-new"),
        )
        assertNull(released)
    }

    @Test
    fun `직접 입력 문구가 없던 알람은 놓을 것도 없다`() {
        assertNull(manualMessageReleasedByEdit(alarm(messageId = null), alarm(messageId = "m-new")))
        assertNull(manualMessageReleasedByEdit(alarm(messageId = ""), alarm(messageId = "m-new")))
    }

    private fun alarm(
        messageId: String?,
        cacheKey: String? = "cache-key",
    ) = AlarmEntity(
        id = "alarm-1",
        label = "voice alarm",
        hour = 7,
        minute = 30,
        fireAtMillis = 1_000L,
        repeatDaysMask = 0x7f,
        holidayOff = false,
        snoozeEnabled = true,
        snoozeMinutes = 5,
        snoozeRepeatLimit = SnoozeRepeatLimits.THREE,
        snoozeCount = 0,
        vibrationPattern = VibrationPatterns.DEFAULT,
        playMode = AlarmPlayModes.VOICE_ONLY,
        defaultAlarmSoundId = DefaultAlarmSounds.BUNDLED_DEFAULT,
        localAudioUri = null,
        audioCacheKey = cacheKey,
        rawAudioUri = null,
        voiceSource = VoiceSources.TTS_PROFILE,
        voiceProfileId = "voice-1",
        voiceListenerTitle = null,
        voiceText = "좋은 아침",
        voiceCategory = "custom",
        voiceLanguage = null,
        voiceRandomPrompt = false,
        voiceRandomContext = null,
        voiceWeatherCountry = null,
        voiceWeatherCity = null,
        voiceFortuneGender = null,
        voiceFortuneBirthDate = null,
        voiceFortuneBirthTime = null,
        dynamicVoicePreparedForFireAtMillis = null,
        voiceRepeat = true,
        voiceVolumePercent = 100,
        ttsMessageId = messageId,
        remoteAlarmId = null,
        lastSyncedAtMillis = null,
        syncState = AlarmSyncStates.SYNCED,
        origin = AlarmOrigins.LOCAL_OWNED,
        alarmVolumePercent = 100,
        alarmSoundUri = null,
        alarmSoundLabel = null,
        enabled = true,
        state = AlarmStates.SCHEDULED,
        createdAtMillis = 1_000L,
        updatedAtMillis = 1_000L,
        ownerUserId = "user-a",
    )
}
