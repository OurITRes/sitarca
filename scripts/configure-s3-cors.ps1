# Configure CORS for S3 bucket to allow browser uploads
# This script sets up CORS configuration for the adcyberwatch-raw bucket

$bucketName = "adcyberwatch-raw"
$region = "ca-central-1"

# Create CORS configuration JSON
$corsConfig = @"
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:5173", "http://127.0.0.1:5173"],
      "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
"@

# Save to temporary file
$corsConfigFile = "cors-config.json"
$corsConfig | Out-File -FilePath $corsConfigFile -Encoding utf8

Write-Host "Applying CORS configuration to S3 bucket: $bucketName" -ForegroundColor Cyan

try {
    # Apply CORS configuration using AWS CLI
    aws s3api put-bucket-cors `
        --bucket $bucketName `
        --cors-configuration file://$corsConfigFile `
        --region $region

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nCORS configuration applied successfully!" -ForegroundColor Green
        Write-Host "`nVerifying CORS configuration..." -ForegroundColor Cyan
        
        # Verify the configuration
        aws s3api get-bucket-cors --bucket $bucketName --region $region
        
        Write-Host "`nYou can now upload files from http://localhost:5173" -ForegroundColor Green
    } else {
        Write-Host "`nFailed to apply CORS configuration. Error code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Make sure you have AWS credentials configured with s3:PutBucketCors permission" -ForegroundColor Yellow
    }
} catch {
    Write-Host "`nError: $_" -ForegroundColor Red
    Write-Host "Make sure AWS CLI is installed and configured" -ForegroundColor Yellow
} finally {
    # Clean up temporary file
    if (Test-Path $corsConfigFile) {
        Remove-Item $corsConfigFile
    }
}
