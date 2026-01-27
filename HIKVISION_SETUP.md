# Hikvision Terminal Integration Setup

## Overview
Your HRMS now automatically records attendance when employees use the Hikvision face/fingerprint terminal. No GPS location required from employees - the system uses the device's predefined location.

## How It Works
1. Employee scans face or fingerprint on Hikvision terminal
2. Device sends event to your HRMS backend
3. Backend automatically creates attendance record with device location
4. Attendance appears in your HRMS database instantly

## Setup Steps

### 1. Configure Device Location (in `.env`)
Edit `backend/.env` and set your device's location:
```env
HIKVISION_DEVICE_LATITUDE=22.5726
HIKVISION_DEVICE_LONGITUDE=88.3639
```
Replace with your actual office coordinates.

### 2. Map Device Users to HRMS Employees
For each employee in your HRMS database, set their `device_user_id` to match the Hikvision terminal's user ID:

**Option A: Via Database**
```sql
UPDATE employees SET device_user_id = '25' WHERE employee_code = 'EMP001';
UPDATE employees SET device_user_id = '48' WHERE employee_code = 'EMP002';
-- etc...
```

**Option B: Via Admin Panel (if you add UI later)**
- Go to Employee Management
- Edit employee
- Set "Device User ID" field to the Hikvision terminal user number

### 3. Find Hikvision User IDs
Check the events already received to see existing user IDs:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/hikvision/events"
```

Look for `employeeNoString` in the output (e.g., "25", "48", "16", etc.)

### 4. Test the Integration
1. Map one test employee in the database
2. Have that employee scan face/fingerprint on device  
3. Check attendance records:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/attendances"
```

## Current Device Users Detected
Based on recent events, these device user IDs have been active:
- User ID 13, 16, 17, 19, 22, 23, 25, 26, 28, 32, 39, 41, 42, 47, 48

Map these to your HRMS employees to enable automatic attendance.

## Attendance Logic
- **checkIn event** → Creates new attendance record with check_in time
- **checkOut event** → Updates existing record with check_out time
- **Location** → Always uses `HIKVISION_DEVICE_LATITUDE` and `HIKVISION_DEVICE_LONGITUDE`
- **Device info** → Recorded as "Hikvision Face Terminal"

## Fallback Mapping
If `device_user_id` is not set, the system will try to match by `employee_code`. 
So if your employee code matches the device user ID, it will work automatically.

## Security (Optional)
Add webhook secret in `.env`:
```env
HIKVISION_WEBHOOK_SECRET=your-secret-key-here
```
Then configure the same secret in the Hikvision device web UI.

## Troubleshooting
- **Employee not found**: Check device_user_id mapping in employees table
- **No check-in**: Verify device is sending "checkIn" status (not "undefined")
- **No check-out**: Employee must have existing check-in record for today
- **Check logs**: `backend/storage/logs/laravel.log` for processing errors

## Next Steps
1. Map all employee device_user_id fields
2. Test with a few employees
3. Monitor `storage/logs/laravel.log` for any mapping issues
4. Optionally add UI in admin panel to manage device_user_id mappings
