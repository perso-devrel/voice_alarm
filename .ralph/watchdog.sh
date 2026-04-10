#!/usr/bin/env bash
# .ralph/watchdog.sh - 스톨 감지 및 강제 종료
set -u
RALPH_DIR="$(cd "$(dirname "$0")" && pwd)"
HEARTBEAT="$RALPH_DIR/heartbeat"
PID_FILE="$RALPH_DIR/claude.pid"
LOG="$RALPH_DIR/logs/watchdog.log"
THRESHOLD="${THRESHOLD:-1800}"  # 30분

mkdir -p "$RALPH_DIR/logs"
echo "[$(date)] watchdog start (threshold=${THRESHOLD}s)" >> "$LOG"

while true; do
  if [ -f "$HEARTBEAT" ]; then
    now=$(date +%s)
    # Linux/Git Bash: stat -c, macOS: stat -f
    if stat -c %Y "$HEARTBEAT" >/dev/null 2>&1; then
      mtime=$(stat -c %Y "$HEARTBEAT")
    else
      mtime=$(stat -f %m "$HEARTBEAT")
    fi
    age=$(( now - mtime ))
    if (( age > THRESHOLD )); then
      echo "[$(date)] STALL detected (age=${age}s) - killing claude" >> "$LOG"
      if [ -f "$PID_FILE" ]; then
        pid=$(cat "$PID_FILE" 2>/dev/null)
        if [ -n "$pid" ]; then
          kill -TERM "$pid" 2>/dev/null || true
          sleep 2
          kill -KILL "$pid" 2>/dev/null || true
        fi
      fi
      pkill -f "claude -p" 2>/dev/null || true
      touch "$HEARTBEAT"  # 리셋
    fi
  fi
  sleep 60
done
