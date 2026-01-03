<?php

namespace App\Services;

use App\Models\Action;
use App\Models\Holiday;
use App\Models\Employee;

class HolidayService
{
    /**
     * Check if a given date is a holiday for an employee.
     * Returns the Holiday model if true, null otherwise.
     */
    public function getHolidayForEmployee($date, Employee $employee)
    {
        return Holiday::whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->where(function ($query) use ($employee) {
                // Global Holidays
                $query->where('type', 'Global')
                      // Department Holidays
                      ->orWhere(function ($q) use ($employee) {
                          $q->where('type', 'Department')
                            ->where('department_id', $employee->department_id);
                      })
                      // Location Holidays (if location exists on employee, strict match)
                      ->orWhere(function ($q) use ($employee) {
                          $q->where('type', 'Location')
                            ->where('location', $employee->address); // Using address as location proxy for now per plan
                      });
            })
            ->first();
    }

    /**
     * Calculate effective leave days excluding holidays and weekends.
     */
    public function calculateLeaveDays($startDate, $endDate, Employee $employee)
    {
        $start = \Carbon\Carbon::parse($startDate);
        $end = \Carbon\Carbon::parse($endDate);
        $days = 0;
        $holidayCount = 0;

        while ($start->lte($end)) {
            // Check Weekend (Sunday)
            if ($start->isSunday()) {
                $start->addDay();
                continue;
            }

            // Check Holiday
            if ($this->getHolidayForEmployee($start->toDateString(), $employee)) {
                $holidayCount++;
                $start->addDay();
                continue;
            }

            $days++;
            $start->addDay();
        }

        return [
            'days' => $days,
            'holidays' => $holidayCount
        ];
    }
}
