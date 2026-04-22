import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SpeakerPicker, { type SpeakerPickerApi } from '../src/components/SpeakerPicker';
import type { Speaker, VoiceUploadMeta } from '../src/services/api';

function makeFile(name = 'sample.mp3') {
  return new File([new Uint8Array([1, 2, 3, 4])], name, { type: 'audio/mpeg' });
}

function meta(overrides: Partial<VoiceUploadMeta> = {}): VoiceUploadMeta {
  return {
    id: '50000000-0000-4000-8000-000000000001',
    objectKey: 'mem://u/x',
    mimeType: 'audio/mpeg',
    sizeBytes: 4,
    durationMs: 4200,
    originalName: 'sample.mp3',
    createdAt: '2026-04-21T00:00:00Z',
    ...overrides,
  };
}

function speaker(id: string, label: string, startMs = 0, endMs = 3000): Speaker {
  return { id, upload_id: meta().id, label, start_ms: startMs, end_ms: endMs, confidence: 0.9 };
}

function fakeApi(overrides: Partial<SpeakerPickerApi> = {}): SpeakerPickerApi {
  return {
    uploadVoiceAudio: vi.fn().mockResolvedValue(meta()),
    separateUpload: vi.fn().mockResolvedValue([
      speaker('s1', '화자 1', 0, 3000),
      speaker('s2', '화자 2', 3000, 6000),
    ]),
    listSpeakers: vi.fn().mockResolvedValue([]),
    renameSpeaker: vi.fn().mockResolvedValue({ id: 's1', label: '엄마' }),
    ...overrides,
  };
}

function selectFile(file: File) {
  const input = screen.getByLabelText('오디오 파일 선택') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

describe('SpeakerPicker', () => {
  it('최초에는 파일 선택 입력만 노출된다', () => {
    render(<SpeakerPicker onClose={vi.fn()} api={fakeApi()} />);
    expect(screen.getByLabelText('오디오 파일 선택')).not.toBeNull();
    expect(screen.queryByRole('radiogroup', { name: '감지된 화자 목록' })).toBeNull();
  });

  it('업로드 후 분리 결과를 리스트로 표시한다', async () => {
    const api = fakeApi();
    render(<SpeakerPicker onClose={vi.fn()} api={api} />);

    selectFile(makeFile());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /업로드 후 화자 감지/ }));
    });

    await waitFor(() =>
      expect(screen.getByRole('radiogroup', { name: '감지된 화자 목록' })).not.toBeNull(),
    );
    expect(screen.getByText('화자 1')).not.toBeNull();
    expect(screen.getByText('화자 2')).not.toBeNull();
    expect(api.uploadVoiceAudio).toHaveBeenCalledTimes(1);
    expect(api.separateUpload).toHaveBeenCalledTimes(1);
  });

  it('업로드 실패 시 에러 메시지를 표시하고 분리 API 를 호출하지 않는다', async () => {
    const api = fakeApi({
      uploadVoiceAudio: vi.fn().mockRejectedValue(new Error('네트워크 오류')),
    });
    render(<SpeakerPicker onClose={vi.fn()} api={api} />);

    selectFile(makeFile());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /업로드 후 화자 감지/ }));
    });

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('네트워크 오류');
    expect(api.separateUpload).not.toHaveBeenCalled();
  });

  it('기존 분리 결과가 있으면 재분리하지 않고 즉시 노출한다', async () => {
    const api = fakeApi({
      listSpeakers: vi.fn().mockResolvedValue([speaker('s9', '이전 화자', 100, 2000)]),
    });
    render(<SpeakerPicker onClose={vi.fn()} api={api} />);

    selectFile(makeFile());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /업로드 후 화자 감지/ }));
    });

    await waitFor(() => expect(screen.getByText('이전 화자')).not.toBeNull());
    expect(api.separateUpload).not.toHaveBeenCalled();
  });

  it('라벨 편집 후 엔터로 renameSpeaker 를 호출한다', async () => {
    const api = fakeApi();
    render(<SpeakerPicker onClose={vi.fn()} api={api} />);

    selectFile(makeFile());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /업로드 후 화자 감지/ }));
    });
    await screen.findByText('화자 1');

    const [renameBtn] = screen.getAllByRole('button', { name: /이름 변경/ });
    fireEvent.click(renameBtn);
    const editInput = await screen.findByLabelText('화자 1 라벨 편집');
    fireEvent.change(editInput, { target: { value: '엄마' } });
    await act(async () => {
      fireEvent.keyDown(editInput, { key: 'Enter' });
    });

    await waitFor(() => expect(api.renameSpeaker).toHaveBeenCalledTimes(1));
    const [uploadIdArg, speakerIdArg, labelArg] = (api.renameSpeaker as ReturnType<typeof vi.fn>)
      .mock.calls[0];
    expect(uploadIdArg).toBe(meta().id);
    expect(speakerIdArg).toBe('s1');
    expect(labelArg).toBe('엄마');
  });

  it('선택 전에는 onConfirm 버튼이 비활성화된다', async () => {
    const onConfirm = vi.fn();
    const api = fakeApi();
    render(<SpeakerPicker onClose={vi.fn()} onConfirm={onConfirm} api={api} />);

    selectFile(makeFile());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /업로드 후 화자 감지/ }));
    });
    await screen.findByText('화자 1');

    const confirm = screen.getByRole('button', { name: /선택한 화자로 진행/ });
    expect(confirm.getAttribute('disabled')).not.toBeNull();

    fireEvent.click(screen.getByText('화자 2'));
    await waitFor(() => expect(confirm.getAttribute('disabled')).toBeNull());
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0][0].id).toBe('s2');
  });

  it('빈 결과는 "감지된 화자가 없습니다." 안내를 보여준다', async () => {
    const api = fakeApi({
      separateUpload: vi.fn().mockResolvedValue([]),
    });
    render(<SpeakerPicker onClose={vi.fn()} api={api} />);

    selectFile(makeFile());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /업로드 후 화자 감지/ }));
    });

    await waitFor(() => expect(screen.getByText(/감지된 화자가 없습니다/)).not.toBeNull());
  });
});
