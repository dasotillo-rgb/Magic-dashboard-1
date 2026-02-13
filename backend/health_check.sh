#!/bin/bash
PID=249329
LOG_FILE="backend/database/health_check.log"

echo "[$(date)] --- Health Check ---" >> $LOG_FILE

if ps -p $PID > /dev/null
then
   echo "Calibration engine (PID $PID) is running." >> $LOG_FILE
   # Opcional: monitorear CPU/Memoria
   # ps -p $PID -o %cpu,%mem >> $LOG_FILE
else
   echo "CRITICAL: Calibration engine (PID $PID) is NOT running." >> $LOG_FILE
   echo "Attempting to restart..." >> $LOG_FILE
   
   # Intento de reinicio
   source backend/venv/bin/activate
   nohup python3 backend/engine/calibration_engine_v4.py > backend/database/calibration_log.txt 2>&1 &
   RESTART_PID=$!
   
   if ps -p $RESTART_PID > /dev/null
   then
      echo "SUCCESS: Engine restarted with new PID $RESTART_PID." >> $LOG_FILE
   else
      echo "FAILURE: Could not restart the engine." >> $LOG_FILE
   fi
fi
