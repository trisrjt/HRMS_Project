<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Payslip</title>
    <style>
        @page {
            margin: 30px 40px;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 13px;
            color: #000;
            line-height: 1.3;
        }
        .container {
            width: 100%;
            margin: 0 auto;
            position: relative;
        }
        .page-break {
            page-break-after: always;
        }
        .page-break:last-child {
            page-break-after: avoid;
        }
        
        /* Header */
        .logo-text {
            text-align: right;
            margin-bottom: 20px;
            font-size: 24px;
            color: #76b729; /* Green from image */
            font-weight: normal;
        }
        /* Logo dots simulation */
        .logo-icon {
            display: inline-block;
            margin-right: 8px;
            vertical-align: middle;
        }
        .dot {
            display: inline-block;
            background-color: #76b729;
            border-radius: 50%;
            margin-left: 2px;
            vertical-align: bottom;
        }
        .dot-s { width: 6px; height: 10px; border-radius: 3px; }
        .dot-m { width: 6px; height: 14px; border-radius: 3px; }
        .dot-l { width: 6px; height: 18px; border-radius: 3px; }

        .company-name {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
            color: #000;
        }
        .company-address {
            font-size: 12px;
            color: #000;
        }
        
        .title {
            font-size: 14px;
            font-weight: bold;
            text-decoration: underline;
            margin: 30px 0 20px 0;
            text-transform: uppercase;
        }

        /* Employee Info Grid */
        .info-table {
            width: 100%;
            margin-bottom: 25px;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 5px 0;
            vertical-align: top;
        }
        .label {
            width: 130px;
            font-weight: normal; 
        }
        .val {
            font-weight: normal;
            font-size: 13px;
        }

        /* Salary Table */
        .salary-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .salary-table th {
            text-align: left;
            border-bottom: 1px solid #000; /* Thin underline as per image look */
            padding: 5px 0;
            font-weight: normal;
            text-decoration: underline;
        }
        .salary-table td {
            padding: 5px 0;
            vertical-align: top;
        }
        
        .col-left {
            width: 50%;
            padding-right: 40px;
        }
        .col-right {
            width: 50%;
            padding-left: 10px;
        }

        /* Alignments */
        .float-right {
            float: right;
            text-align: right;
        }
        
        /* Total Row */
        .total-row {
            border-top: 2px solid #000; /* Bold line above totals */
            padding-top: 5px;
            margin-top: 5px; 
            font-weight: bold;
            font-size: 14px;
        }
        
        /* Footer */
        .footer-note {
            margin-top: 40px;
            font-size: 12px;
            line-height: 1.5;
        }
        .auth-sign-box {
            margin-top: 30px;
            text-align: right;
            position: relative;
        }
        .sign-text {
            font-size: 12px;
            margin-bottom: 10px;
        }
        .stamp-placeholder {
            /* Simulating the stamp location */
            height: 80px; 
            width: 80px;
            display: inline-block;
            /* border: 1px dashed #ccc; */ /* Debugging only */
        }
        
        /* Digital Signature Styles */
        .digital-signature {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 2px solid #76b729;
        }
        .signature-box {
            background-color: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #76b729;
        }
        .signature-content {
            width: 100%;
        }
        .signature-left {
            width: 70%;
            float: left;
        }
        .signature-right {
            width: 30%;
            float: right;
            text-align: center;
        }
        .signature-badge {
            width: 80px;
            height: 80px;
            border: 2px solid #76b729;
            border-radius: 50%;
            margin: 0 auto;
            padding-top: 20px;
            background-color: #fff;
        }
        .signature-footer {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #ddd;
            font-size: 9px;
            color: #888;
            text-align: center;
            clear: both;
        }

    </style>
</head>
<body>
    @foreach($payslips as $payslip)
    <div class="container {{ !$loop->last ? 'page-break' : '' }}">
        
        <!-- Logo Header (Right Aligned) -->
        <div class="logo-text">
           <span class="logo-icon">
               <span class="dot dot-s"></span>
               <span class="dot dot-m"></span>
               <span class="dot dot-l"></span>
           </span>
           <span style="font-family: sans-serif; letter-spacing: 0.5px;">mind & matter</span>
        </div>

        <!-- Company Info (Left Aligned) -->
        <div class="header">
            <div class="company-name">MIND & MATTER MARKETING SOLUTIONS PRIVATE LIMITED</div>
            <div class="company-address">Regd. Office: 360 - Plot No. 5, Block BF, Shanti Pally, Kolkata - 700107</div>
        </div>

        <!-- Title -->
        <div class="title">SALARY &nbsp; ADVICE</div>

        <!-- Employee Details Grid -->
        <table class="info-table">
            <tr>
                <td class="label">For the month of:</td>
                <td class="val">{{ \Carbon\Carbon::createFromDate($payslip->year, $payslip->month, 1)->format('F Y') }}</td>
                <!-- Right Side -->
                <td class="label" style="text-align: right; width: 150px;">Date of Joining :</td>
                <td class="val" style="text-align: right; width: 100px;">{{ \Carbon\Carbon::parse($payslip->employee->date_of_joining)->format('d-m-Y') }}</td>
            </tr>
            <tr>
                <td class="label">Employee name:</td>
                <td class="val">{{ $payslip->employee->user->name }}</td>
                <!-- Right Side -->
                <td class="label" style="text-align: right;">Employee code:</td>
                <td class="val" style="text-align: right;">{{ $payslip->employee->employee_code }}</td>
            </tr>
            <tr>
                <td colspan="4" style="height: 15px;"></td>
            </tr>
            <tr>
                <td class="label">Designation:</td>
                <td class="val">{{ $payslip->employee->designation->name ?? '' }}</td>
                <!-- Right Side -->
                <td class="label" style="text-align: right;">Posted at:</td>
                <!-- Hardcoded for now based on image/request or use location data -->
                <td class="val" style="text-align: right;">{{ $payslip->employee->location ?? 'Shanti Pally, Kol' }}</td>
            </tr>
        </table>

        <!-- Salary Details Table -->
        <table class="salary-table">
            <thead>
                <tr>
                    <th class="col-left">Particulars <span class="float-right">Amount (Rs)</span></th>
                    <th class="col-right">Adjustments/deductions: <span class="float-right">Amount (Rs)</span></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <!-- LEFT COLUMN (EARNINGS) -->
                    <td class="col-left">
                        <div style="margin-bottom: 5px;">
                            Basic
                            <span class="float-right">{{ number_format($payslip->basic, 2) }}</span>
                        </div>
                        <div style="margin-bottom: 5px;">
                            HRA
                            <span class="float-right">{{ number_format($payslip->hra, 2) }}</span>
                        </div>
                        
                        @if(($payslip->allowances ?? 0) > 0)
                        <div style="margin-bottom: 5px;">
                            Special Allowance
                            <span class="float-right">{{ number_format($payslip->allowances, 2) }}</span>
                        </div>
                        @endif

                        @if($payslip->da > 0)
                        <div style="margin-bottom: 5px;">
                            DA
                            <span class="float-right">{{ number_format($payslip->da, 2) }}</span>
                        </div>
                        @endif
                        
                        <!-- Fixed Height Spacer to align totals at bottom -->
                        <div style="height: 40px;"></div>

                        <div class="total-row">
                            Total
                            <span class="float-right">{{ number_format($payslip->total_earnings, 2) }}</span>
                        </div>
                    </td>

                    <!-- RIGHT COLUMN (DEDUCTIONS/NET) -->
                    <td class="col-right">
                         <!-- Deductions logic -->
                        @php
                             $hasPf = $payslip->pf > 0;
                             $hasEsic = $payslip->esic > 0;
                             $hasPtax = $payslip->ptax > 0;
                             $hasOther = ($payslip->total_deductions - ($payslip->pf + $payslip->esic + $payslip->ptax)) > 0;
                             $hasAnyDeduction = $hasPf || $hasEsic || $hasPtax || $hasOther;
                        @endphp

                        @if(!$hasAnyDeduction)
                             <!-- If no deductions, just show NA aligned right, as per image style if needed -->
                             <div style="text-align: right; margin-bottom: 5px;">NA</div>
                        @else
                            @if($hasPf)
                            <div style="margin-bottom: 5px;">
                                PF <span class="float-right">{{ number_format($payslip->pf, 2) }}</span>
                            </div>
                            @endif
                            @if($hasEsic)
                            <div style="margin-bottom: 5px;">
                                ESIC <span class="float-right">{{ number_format($payslip->esic, 2) }}</span>
                            </div>
                            @endif
                            @if($hasPtax)
                            <div style="margin-bottom: 5px;">
                                P-Tax <span class="float-right">{{ number_format($payslip->ptax, 2) }}</span>
                            </div>
                            @endif
                        @endif
                        
                        <!-- Spacer to match left column height -->
                        <div style="height: {{ $hasAnyDeduction ? '40px' : '65px' }};"></div> 

                        <!-- Bank Transfer (Net Pay) -->
                        <div class="total-row">
                             Bank Transfer
                             <span class="float-right">{{ number_format($payslip->net_pay, 2) }}</span>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Footer / Signature -->
        <div style="margin-top: 30px;">
            <div style="float: left; width: 60%;">
                <p class="footer-note">
                    Note: Actual Salary INR {{ number_format($payslip->total_earnings, 0) }}/-<br>
                    INR {{ number_format($payslip->net_pay, 0) }} is {{ $payslip->days_worked }} day's salary.
                </p>
            </div>
            <div style="float: right; width: 35%; text-align: center;">
                 <div class="auth-sign-box">
                    <div class="sign-text">Authorised Signatory</div>
                    
                    <!-- Space for Stamp/Signature -->
                    <div style="height: 60px; margin-top: 10px;">
                         <!-- Image could go here if uploaded -->
                    </div>
                    
                    <!-- Line for signature if needed, or just clear space as per image (image had a stamp and signature over it) -->
                    <div style="border-bottom: 1px solid #000; width: 100%; margin-top: 10px;"></div>
                 </div>
            </div>
            <div style="clear: both;"></div>
        </div>

        <!-- Digital Signature Section -->
        @if(isset($signatureData))
        <div class="digital-signature">
            <div class="signature-box">
                <div class="signature-content">
                    <div class="signature-left">
                        <div style="font-size: 11px; color: #666; margin-bottom: 8px;">
                            <strong style="color: #000;">🔒 DIGITALLY SIGNED DOCUMENT</strong>
                        </div>
                        <div style="font-size: 10px; color: #555; line-height: 1.6;">
                            <div><strong>Document ID:</strong> {{ $signatureData['signature_id'] }}</div>
                            <div><strong>Generated By:</strong> {{ $signatureData['generated_by'] }}</div>
                            <div><strong>Generated At:</strong> {{ $signatureData['generated_at'] }}</div>
                            <div><strong>Issuer:</strong> {{ $signatureData['company'] }}</div>
                        </div>
                    </div>
                    <div class="signature-right">
                        <div class="signature-badge">
                            <div style="text-align: center; font-size: 9px; line-height: 1.2;">
                                <strong style="color: #76b729; font-size: 28px;">✓</strong><br>
                                <span style="color: #666;">VERIFIED</span>
                            </div>
                        </div>
                    </div>
                    <div style="clear: both;"></div>
                </div>
                <div class="signature-footer">
                    This document is password protected and digitally signed. Any unauthorized modification will invalidate the signature.
                    @if($payslip->employee->dob)
                    <br>Password Format: Employee Code + DOB (DDMMYYYY)
                    @endif
                </div>
            </div>
        </div>
        @endif

    </div>
    @endforeach
</body>
</html>
