# MSG91 Local Test Script
# This directly calls the MSG91 SendOTP API to verify your DLT template works

# --- FILL THESE IN ---
$AUTH_KEY     = "YOUR_MSG91_AUTH_KEY_HERE"
$TEMPLATE_ID  = "69df4bef132297c323058a23"
$PHONE_NUMBER = "9890049517"   # Your phone number WITH country code, NO + sign (e.g., 919876543210)
$TEST_OTP     = "123456"          # Any 6-digit test OTP
# ----------------------

$body = @{
    template_id = $TEMPLATE_ID
    mobile      = $PHONE_NUMBER
    otp         = $TEST_OTP
    name        = "User"
    project     = "PolicyWise"
} | ConvertTo-Json

Write-Host "`n=== MSG91 OTP Test ===" -ForegroundColor Cyan
Write-Host "Template ID : $TEMPLATE_ID"
Write-Host "Phone       : $PHONE_NUMBER"
Write-Host "OTP         : $TEST_OTP"
Write-Host "Sending request to MSG91..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod `
        -Uri "https://control.msg91.com/api/v5/otp" `
        -Method POST `
        -Headers @{ "authkey" = $AUTH_KEY; "Content-Type" = "application/json" } `
        -Body $body

    Write-Host "`n=== Response ===" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
    
    if ($response.type -eq "success") {
        Write-Host "`n SUCCESS! Check your phone for the OTP SMS." -ForegroundColor Green
    } else {
        Write-Host "`n FAILED: $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "`n ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
