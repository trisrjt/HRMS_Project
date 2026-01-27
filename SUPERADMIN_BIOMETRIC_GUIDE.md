# Hikvision Biometric Attendance - SuperAdmin Guide

## Overview

The Hikvision DS-K1T320EFWX terminal integration provides automatic attendance recording with face recognition and fingerprint scanning. All biometric data, including captured face images, is exclusively accessible through the **SuperAdmin Portal**.

## Key Features

✅ **Automatic Attendance**: Face/fingerprint scans create attendance records instantly  
✅ **Face Snapshot Storage**: Captured images stored and viewable in SuperAdmin portal  
✅ **Biometric Method Tracking**: System logs whether face, fingerprint, or card was used  
✅ **SuperAdmin-Only Access**: All biometric data restricted to SuperAdmin role (role_id = 1)  
✅ **Permission Management**: SuperAdmin can grant access to HR/Admin users  
✅ **Predefined Location**: Device GPS coordinates used instead of employee location  
✅ **Real-time Processing**: Webhook processes events immediately upon device trigger  
✅ **Export Reports**: Download biometric attendance data as CSV

---

## System Architecture

### Backend Components

1. **HikvisionController** (`app/Http/Controllers/HikvisionController.php`)
   - Receives webhook events from device
   - Processes attendance events automatically
   - Captures and stores face snapshots
   - Detects biometric method used

2. **SuperAdminBiometricController** (`app/Http/Controllers/SuperAdminBiometricController.php`)
   - Lists all biometric attendance records (SuperAdmin only)
   - Shows detailed attendance with face images
   - Exports reports
   - Manages HR/Admin access permissions
   - Provides statistics

3. **HikvisionService** (`app/Services/HikvisionService.php`)
   - Stores raw device events to JSON file
   - Retrieves recent events for debugging

### Database Schema

**attendances table** (biometric fields):
- `biometric_method` (string) - face, fingerprint, card, or unknown
- `face_snapshot_url` (text) - relative path to stored image
- `device_event_id` (text) - unique event identifier
- `device_metadata` (json) - raw event data from device

**employees table**:
- `device_user_id` (string) - maps to Hikvision terminal user ID

**users table**:
- `permissions` (json) - stores access permissions like `{"biometric_access": "view"}`

### Frontend Components

**BiometricAttendance.js** (`frontend-react/src/pages/superadmin/BiometricAttendance.js`)
- SuperAdmin-only React component
- Displays biometric attendance records in table format
- Shows face snapshot thumbnails
- Filters by date, employee, method
- Full-size image modal
- Export functionality
- Statistics dashboard

---

## SuperAdmin Portal Access

### Accessing Biometric Attendance

1. Login as SuperAdmin (role_id = 1)
2. Navigate to: **SuperAdmin Portal → Biometric Attendance**
3. View all biometric attendance records with face snapshots

### Features Available

#### 1. **Attendance Table**
- Employee name and code
- Check-in/check-out times
- Biometric method badge (Face/Fingerprint/Card)
- Face snapshot thumbnail (click to enlarge)
- Device information
- Attendance status

#### 2. **Filters**
- **Date Range**: Filter by start and end date
- **Employee**: Filter by specific employee
- **Biometric Method**: Filter by face/fingerprint/card/unknown
- **Refresh**: Reload data manually

#### 3. **Statistics Dashboard**
- Total biometric attendance records
- Records with face snapshots
- Unique employees scanned
- Breakdown by biometric method

#### 4. **Export Reports**
- Click "Export" button to download CSV
- Includes all filtered records
- Contains: date, employee, times, method, device, status

#### 5. **Image Viewer**
- Click any face thumbnail to open full-size modal
- View complete attendance details
- See raw device metadata (JSON)

---

## Granting Access to HR/Admin

SuperAdmin can grant biometric data access to HR or Admin users.

### Access Levels

1. **none** - No access (default for HR/Admin)
2. **view** - Can view biometric attendance records
3. **manage** - Can view, export, and manage records

### Grant Access via API

**Endpoint**: `POST /api/superadmin/biometric/grant-access`

**Request**:
```json
{
  "user_id": 5,
  "access_type": "view"
}
```

**Response**:
```json
{
  "message": "Access granted successfully",
  "user": "John HR Manager",
  "access": "view"
}
```

### Check User Access

**Endpoint**: `GET /api/superadmin/biometric/check-access`

**Response** (for SuperAdmin):
```json
{
  "access": "manage"
}
```

**Response** (for HR/Admin with granted access):
```json
{
  "access": "view"
}
```

**Response** (for users without access):
```json
{
  "access": "none"
}
```

---

## Device Setup

### 1. Network Configuration

- **Device IP**: 192.168.31.170 (set static IP recommended)
- **Server IP**: 192.168.31.27 (HRMS backend)
- **Connection**: Ethernet cable, same local network

### 2. Webhook Configuration on Device

1. Access device web interface: `http://192.168.31.170`
2. Login with admin credentials
3. Navigate to: **Configuration → Event → HTTP Notification**
4. Configure:
   - **URL**: `http://192.168.31.27:8000/api/hikvision/webhook`
   - **Method**: POST
   - **Enable**: Access Control Events
5. Navigate to: **Configuration → Access Control → Authentication Mode**
6. Enable: Face Recognition, Fingerprint
7. Save all settings

### 3. Backend Configuration

Edit `backend/.env`:

```env
# Hikvision Device Configuration
HIKVISION_DEVICE_IP=192.168.31.170
HIKVISION_DEVICE_LATITUDE=22.5726
HIKVISION_DEVICE_LONGITUDE=88.3639
HIKVISION_DEVICE_USER=admin
HIKVISION_DEVICE_PASS=your_device_password
HIKVISION_WEBHOOK_SECRET=
```

**Coordinate Notes**:
- Use your actual office location coordinates
- Format: decimal degrees (e.g., 22.5726, 88.3639 for Kolkata)
- This location is stored with every attendance record

---

## Employee Mapping

### Map Device Users to HRMS Employees

For attendance to work, you must map Hikvision terminal user IDs to HRMS employee records.

#### Method 1: Direct SQL

```sql
-- Find device user IDs from recent events
SELECT JSON_EXTRACT(device_metadata, '$.raw_event.AccessControllerEvent.employeeNoString') as device_user_id
FROM attendances 
WHERE device_metadata IS NOT NULL
GROUP BY device_user_id;

-- Map employees (example)
UPDATE employees SET device_user_id = '25' WHERE employee_code = 'EMP001';
UPDATE employees SET device_user_id = '48' WHERE employee_code = 'EMP002';
UPDATE employees SET device_user_id = '16' WHERE employee_code = 'EMP003';
```

#### Method 2: Via Admin Panel (if UI available)

1. Navigate to Employee Management
2. Edit employee profile
3. Set "Device User ID" field
4. Save changes

#### Detected User IDs

From your live device (2026-01-21):
```
13, 16, 17, 19, 22, 23, 25, 26, 28, 32, 39, 41, 42, 47, 48
```

Map these IDs to your actual employees.

---

## API Endpoints

### SuperAdmin Biometric Endpoints

All require `auth:sanctum` middleware and SuperAdmin role (role_id = 1).

#### 1. List Biometric Attendance
```
GET /api/superadmin/biometric/attendance
```

**Query Parameters**:
- `start_date` - Filter by start date (YYYY-MM-DD)
- `end_date` - Filter by end date
- `employee_id` - Filter by employee ID
- `method` - Filter by biometric method (face/fingerprint/card)
- `page` - Page number (default: 1)
- `per_page` - Records per page (default: 15)

**Response**:
```json
{
  "data": [
    {
      "id": 123,
      "employee_id": 5,
      "date": "2026-01-21",
      "check_in": "09:00:00",
      "check_out": "17:00:00",
      "biometric_method": "face",
      "face_snapshot_url": "storage/biometric_snapshots/2026/01/biometric_5_2026-01-21_090015.jpg",
      "device_id": "hikvision_192.168.31.170",
      "device_event_id": "hik_1705825215_abc123",
      "device_metadata": {
        "device_ip": "192.168.31.170",
        "face_rect": {...}
      },
      "employee": {
        "id": 5,
        "employee_code": "EMP001",
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  ],
  "current_page": 1,
  "last_page": 5,
  "per_page": 15,
  "total": 67
}
```

#### 2. Get Single Attendance Detail
```
GET /api/superadmin/biometric/attendance/{id}
```

**Response**: Same as single record above

#### 3. Grant Access to HR/Admin
```
POST /api/superadmin/biometric/grant-access
```

**Request Body**:
```json
{
  "user_id": 5,
  "access_type": "view"
}
```

#### 4. Check User Access
```
GET /api/superadmin/biometric/check-access
```

#### 5. Export Report
```
GET /api/superadmin/biometric/export
```

**Query Parameters**: Same as list endpoint

**Response**:
```json
{
  "message": "Report exported successfully",
  "filename": "biometric_attendance_2026-01-21_140530.csv",
  "download_url": "http://127.0.0.1:8000/storage/reports/biometric_attendance_2026-01-21_140530.csv",
  "total_records": 67
}
```

#### 6. Get Statistics
```
GET /api/superadmin/biometric/statistics
```

**Query Parameters**:
- `start_date` - Optional (default: 30 days ago)
- `end_date` - Optional (default: today)

**Response**:
```json
{
  "total_biometric_attendance": 245,
  "attendance_by_method": [
    {"biometric_method": "face", "count": 180},
    {"biometric_method": "fingerprint", "count": 65}
  ],
  "with_snapshots": 180,
  "unique_employees": 42,
  "date_range": {
    "start": "2025-12-22",
    "end": "2026-01-21"
  }
}
```

---

## How Attendance Recording Works

### Event Flow

1. **Employee Action**:
   - Employee approaches Hikvision terminal
   - Presents face or fingerprint
   - Device authenticates employee

2. **Device Webhook**:
   - Terminal sends HTTP POST to: `http://192.168.31.27:8000/api/hikvision/webhook`
   - Payload contains: employeeNoString, attendanceStatus, FaceRect, timestamp, etc.

3. **Backend Processing** (`HikvisionController::processAttendanceEvent`):
   - Parse event JSON
   - Extract device user ID (employeeNoString)
   - Find matching employee by `device_user_id`
   - Detect biometric method (face/fingerprint/card)
   - Capture face snapshot from device (if face recognition)
   - Create or update attendance record
   - Store biometric data and metadata

4. **Snapshot Capture** (`HikvisionController::captureFaceSnapshot`):
   - Fetch image from device: `http://192.168.31.170/ISAPI/Streaming/channels/1/picture`
   - Save to: `storage/app/public/biometric_snapshots/YYYY/MM/filename.jpg`
   - Store relative path in database

5. **Database Record**:
   ```php
   Attendance::create([
       'employee_id' => 5,
       'date' => '2026-01-21',
       'check_in' => '09:00:15',
       'check_in_latitude' => 22.5726,
       'check_in_longitude' => 88.3639,
       'device_id' => 'hikvision_192.168.31.170',
       'device_type' => 'Hikvision Face Terminal',
       'biometric_method' => 'face',
       'face_snapshot_url' => 'storage/biometric_snapshots/2026/01/biometric_5_2026-01-21_090015.jpg',
       'device_event_id' => 'hik_1705825215_abc123',
       'device_metadata' => [...],
       'status' => 'Present',
   ]);
   ```

6. **SuperAdmin View**:
   - SuperAdmin accesses `/superadmin/biometric-attendance`
   - Frontend fetches: `GET /api/superadmin/biometric/attendance`
   - Displays records with face thumbnails
   - Click thumbnail → view full image and metadata

---

## Troubleshooting

### No Attendance Records Created

**Check 1**: Is employee mapped?
```sql
SELECT id, employee_code, device_user_id FROM employees WHERE device_user_id IS NOT NULL;
```

**Check 2**: Are events being received?
```
GET http://127.0.0.1:8000/api/hikvision/events
```

**Check 3**: Backend logs
```powershell
Get-Content backend/storage/logs/laravel.log -Tail 50
```

Look for: "Hikvision: Check-in recorded" or errors

### Snapshots Not Saving

**Check 1**: Storage directory writable?
```powershell
# Check if directory exists and is writable
Test-Path backend/storage/app/public/biometric_snapshots
```

**Check 2**: Device credentials correct?
- Verify `HIKVISION_DEVICE_USER` and `HIKVISION_DEVICE_PASS` in `.env`
- Test snapshot URL manually:
  ```
  curl -u admin:password http://192.168.31.170/ISAPI/Streaming/channels/1/picture --output test.jpg
  ```

**Check 3**: Firewall blocking request?
- Ensure Laravel server can reach device IP
- Test: `ping 192.168.31.170`

### SuperAdmin Portal Not Loading

**Check 1**: User role is SuperAdmin?
```sql
SELECT id, name, email, role_id FROM users WHERE email = 'your_email@example.com';
```
Should have `role_id = 1`

**Check 2**: Route exists?
```powershell
# List routes
cd backend
php artisan route:list | Select-String "biometric"
```

**Check 3**: Frontend route configured?
- Check: `frontend-react/src/routes/AppRouter.js`
- Should have: `/superadmin/biometric-attendance` route

### Device Not Sending Events

**Check 1**: Webhook URL correct in device?
- Login to device web interface
- Check: Configuration → Event → HTTP Notification
- Should be: `http://192.168.31.27:8000/api/hikvision/webhook`

**Check 2**: Device can reach server?
- From device web interface, test connection
- Or check device logs

**Check 3**: Webhook endpoint working?
```powershell
# Test webhook manually
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/hikvision/webhook" -Method POST -Body '{"test": true}' -ContentType "application/json"
```

---

## Security Considerations

### 1. Access Control
- Biometric data is **SuperAdmin-only** by default
- HR/Admin require explicit permission grant
- Employees have **no access** to biometric data

### 2. Data Privacy
- Face snapshots stored on local server
- No external API calls for biometric data
- Images stored in non-public directory (requires authentication)

### 3. Webhook Security
- Optional HMAC signature verification
- Set `HIKVISION_WEBHOOK_SECRET` in `.env` for production
- Device must send `X-Hik-Signature` header

### 4. Storage
- Snapshots organized by year/month
- Use secure file permissions (755 for directories, 644 for files)
- Consider encrypted storage for production

---

## Production Deployment Checklist

- [ ] Set static IP for Hikvision device
- [ ] Configure webhook URL with HTTPS (SSL certificate)
- [ ] Enable webhook HMAC authentication
- [ ] Set strong device admin password
- [ ] Map all employees to device user IDs
- [ ] Test check-in/check-out flow for multiple employees
- [ ] Verify snapshot capture and storage
- [ ] Configure backup for biometric_snapshots directory
- [ ] Set up log rotation for Laravel logs
- [ ] Test SuperAdmin portal access
- [ ] Document granted permissions for HR/Admin users
- [ ] Set up monitoring/alerts for webhook failures
- [ ] Review and restrict network access to device

---

## File Locations

### Backend
```
backend/
├── app/
│   ├── Http/Controllers/
│   │   ├── HikvisionController.php          # Webhook & snapshot capture
│   │   └── SuperAdminBiometricController.php # SuperAdmin API
│   ├── Models/
│   │   ├── Attendance.php                    # Biometric fields added
│   │   └── User.php                          # Permissions field added
│   └── Services/
│       └── HikvisionService.php              # Event storage
├── database/migrations/
│   ├── 2026_01_21_171456_add_device_user_id_to_employees_table.php
│   ├── 2026_01_21_180000_add_biometric_fields_to_attendances_table.php
│   └── 2026_01_21_190000_add_permissions_to_users_table.php
├── routes/
│   └── api.php                               # Biometric routes
├── storage/
│   ├── app/
│   │   ├── hikvision_events.json             # Raw event log
│   │   └── public/
│   │       ├── biometric_snapshots/          # Face images
│   │       │   └── YYYY/MM/*.jpg
│   │       └── reports/*.csv                 # Exported reports
│   └── logs/
│       └── laravel.log
└── .env                                      # Device config
```

### Frontend
```
frontend-react/
├── src/
│   ├── pages/
│   │   └── superadmin/
│   │       └── BiometricAttendance.js        # SuperAdmin view
│   ├── routes/
│   │   └── AppRouter.js                      # Route config
│   └── components/
│       └── SuperAdminSidebar.jsx             # Menu item added
```

---

## Support & Maintenance

### Database Maintenance

**Clean old events** (JSON file grows over time):
```php
// In HikvisionService.php, events are auto-limited to 500
// To manually clear:
Storage::put('hikvision_events.json', json_encode([]));
```

**Archive old snapshots** (storage can grow large):
```powershell
# Move snapshots older than 6 months to archive
$archiveDate = (Get-Date).AddMonths(-6)
Get-ChildItem "backend/storage/app/public/biometric_snapshots" -Recurse -File | 
  Where-Object {$_.LastWriteTime -lt $archiveDate} | 
  Move-Item -Destination "backend/storage/app/archive/biometric_snapshots"
```

### Monitoring

**Check webhook health**:
```sql
-- Count events received today
SELECT COUNT(*) FROM attendances 
WHERE DATE(created_at) = CURDATE() 
AND device_id LIKE 'hikvision_%';
```

**Check snapshot capture rate**:
```sql
-- Percentage of face records with snapshots
SELECT 
  COUNT(*) as total_face,
  SUM(CASE WHEN face_snapshot_url IS NOT NULL THEN 1 ELSE 0 END) as with_snapshot,
  ROUND(SUM(CASE WHEN face_snapshot_url IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as success_rate
FROM attendances
WHERE biometric_method = 'face';
```

---

## Version History

- **v1.0** (2026-01-21): Initial implementation
  - Automatic attendance recording
  - Face snapshot capture and storage
  - SuperAdmin-only biometric portal
  - Permission management system
  - Export and statistics features

---

## Additional Resources

- **Hikvision ISAPI Documentation**: Contact Hikvision support for API docs
- **Laravel Sanctum**: https://laravel.com/docs/sanctum
- **React Material-UI**: https://mui.com/

---

**End of SuperAdmin Guide**
