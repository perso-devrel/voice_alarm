import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlarms, updateAlarm, deleteAlarm } from '../services/api';
import type { Alarm } from '../types';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function AlarmsPage() {
  const queryClient = useQueryClient();

  const { data: alarms, isLoading } = useQuery({
    queryKey: ['alarms'],
    queryFn: getAlarms,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateAlarm(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alarms'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlarm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alarms'] }),
  });

  const formatRepeat = (days: string) => {
    const parsed: number[] = JSON.parse(days || '[]');
    if (parsed.length === 0) return '한 번만';
    if (parsed.length === 7) return '매일';
    if (JSON.stringify(parsed.sort()) === JSON.stringify([1, 2, 3, 4, 5])) return '평일';
    if (JSON.stringify(parsed.sort()) === JSON.stringify([0, 6])) return '주말';
    return parsed.map((d) => DAYS[d]).join(', ');
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">알람 설정</h2>
        <p className="text-gray-500 mt-1">웹에서 알람을 관리하고 앱에 동기화하세요</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">로딩 중...</div>
      ) : !alarms?.length ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#F2E8E5]">
          <p className="text-5xl mb-4">⏰</p>
          <p className="text-gray-500 text-lg">설정된 알람이 없어요</p>
          <p className="text-gray-400 text-sm mt-1">앱에서 알람을 추가해주세요</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alarms.map((alarm: Alarm) => (
            <div
              key={alarm.id}
              className={`bg-white rounded-2xl p-6 border border-[#F2E8E5] shadow-sm flex items-center gap-6 transition-opacity ${
                !alarm.is_active ? 'opacity-50' : ''
              }`}
            >
              <div className="flex-1">
                <p className="text-4xl font-light text-gray-900">{alarm.time}</p>
                <p className="text-sm text-gray-500 mt-1">{formatRepeat(alarm.repeat_days)}</p>
                <div className="mt-2">
                  <span className="text-sm text-[#FF7F6B] font-medium">🗣️ {alarm.voice_name}</span>
                  <p className="text-sm text-gray-600 mt-0.5">"{alarm.message_text}"</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!alarm.is_active}
                    onChange={() => toggleMutation.mutate({ id: alarm.id, is_active: !alarm.is_active })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#FF7F6B] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#FF7F6B] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>

                <button
                  onClick={() => {
                    if (confirm('이 알람을 삭제하시겠어요?')) {
                      deleteMutation.mutate(alarm.id);
                    }
                  }}
                  className="text-sm text-red-400 hover:text-red-500"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
