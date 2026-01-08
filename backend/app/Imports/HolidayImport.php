<?php

namespace App\Imports;

use App\Models\Holiday;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Carbon\Carbon;

class HolidayImport implements ToModel, WithHeadingRow
{
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        // Skip if name or start_date is missing
        if (empty($row['name']) || empty($row['start_date'])) {
            return null;
        }

        // Log raw row for debugging
        \Illuminate\Support\Facades\Log::info("Import Row: " . json_encode($row));

        // Parse dates
        $startDateStr = trim($row['start_date']);
        $endDateStr = isset($row['end_date']) ? trim($row['end_date']) : null;

        $startDate = null;
        $endDate = null;

        try {
            // 1. Try to parse Start Date
            if (is_numeric($startDateStr)) {
                $startDate = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($startDateStr)->format('Y-m-d');
            } else {
                try {
                    $startDate = Carbon::parse($startDateStr)->format('Y-m-d');
                } catch (\Exception $e) { /* Might be a range string, ignore for now */ }
            }

            // 2. Try to parse End Date
            if (!empty($endDateStr)) {
                if (is_numeric($endDateStr)) {
                    $endDate = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($endDateStr)->format('Y-m-d');
                } else {
                    try {
                        $endDate = Carbon::parse($endDateStr)->format('Y-m-d');
                    } catch (\Exception $e) { /* Ignore invalid end date */ }
                }
            }

            // 3. If End Date is still null, check if Start Date contained a range
            if (!$endDate && !is_numeric($startDateStr)) {
                // ISO Range
                if (preg_match('/(\d{4}[-\/.]\d{2}[-\/.]\d{2})\s*(?:-|to)\s*(\d{4}[-\/.]\d{2}[-\/.]\d{2})/i', $startDateStr, $matches)) {
                    $startDate = Carbon::parse($matches[1])->format('Y-m-d');
                    $endDate = Carbon::parse($matches[2])->format('Y-m-d');
                }
                // Short Range "DD-DD"
                elseif (preg_match('/^(\d{1,2})\s*-\s*(\d{1,2})$/', $startDateStr, $matches)) {
                     $d1 = (int)$matches[1];
                     $d2 = (int)$matches[2];
                     $now = Carbon::now();
                     $startDate = Carbon::create($now->year, $now->month, $d1)->format('Y-m-d');
                     $endDate = Carbon::create($now->year, $now->month, $d2)->format('Y-m-d');
                }
                // Fallback Split
                else {
                    $parts = preg_split('/\s+to\s+/i', $startDateStr);
                    if (count($parts) === 2) {
                        try {
                            $startDate = Carbon::parse(trim($parts[0]))->format('Y-m-d');
                            $endDate = Carbon::parse(trim($parts[1]))->format('Y-m-d');
                        } catch(\Exception $e) {}
                    }
                }
            }

            // 4. Final Fallback
            if ($startDate && !$endDate) {
                $endDate = $startDate;
            }
            
            // Ensure Start Date is set if we found a range but missed the start parse earlier
            // (Handled by regex blocks setting $startDate)

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Date Parse Error: " . $e->getMessage());
            return null;
        }
        
        return new Holiday([
            'name'          => $row['name'],
            'start_date'    => $startDate,
            'end_date'      => $endDate,
            'type'          => 'Global',
            'department_id' => null,
            'location'      => null,
        ]);
    }
}
