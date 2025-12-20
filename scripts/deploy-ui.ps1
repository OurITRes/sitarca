param(
  [string]$StackName = "adcyberwatch-poc",
  [string]$Region = "ca-central-1"
)

$ErrorActionPreference = "Stop"

function Get-StackOutputs([string]$stack, [string]$region) {
  $json = aws cloudformation describe-stacks --stack-name $stack --region $region | ConvertFrom-Json
  return $json.Stacks[0].Outputs
}

function Get-Out([object[]]$outs, [string]$key) {
  $o = $outs | Where-Object { $_.OutputKey -eq $key } | Select-Object -First 1
  if (-not $o) { return $null }
  return $o.OutputValue
}

Write-Host "Reading CloudFormation outputs for stack '$StackName' in region '$Region'..."
$outs = Get-StackOutputs -stack $StackName -region $Region

$uiBucket = Get-Out $outs "UiBucketName"
$distId   = Get-Out $outs "UiDistributionId"
$uiUrl    = Get-Out $outs "UiCloudFrontUrl"

$apiUrl   = Get-Out $outs "HttpApiUrl"
$userPoolId = Get-Out $outs "UserPoolId"
$clientId = Get-Out $outs "UserPoolClientId"
$identityPoolId = Get-Out $outs "IdentityPoolId"

if (-not $uiBucket) { throw "Missing Output UiBucketName" }
if (-not $distId)   { throw "Missing Output UiDistributionId" }
if (-not $uiUrl)    { throw "Missing Output UiCloudFrontUrl" }
if (-not $apiUrl)   { throw "Missing Output HttpApiUrl" }
if (-not $userPoolId) { throw "Missing Output UserPoolId" }
if (-not $clientId) { throw "Missing Output UserPoolClientId" }

Write-Host "UI Bucket: $uiBucket"
Write-Host "UI URL:    $uiUrl"
Write-Host "API URL:   $apiUrl"

# --- Write production env for Vite ---
$envPath = "ui/.env.production.local"
@"
VITE_API_URL=$apiUrl
VITE_COGNITO_REGION=$Region
VITE_COGNITO_USER_POOL_ID=$userPoolId
VITE_COGNITO_CLIENT_ID=$clientId
VITE_COGNITO_REDIRECT_URI=$uiUrl/callback
VITE_COGNITO_IDENTITY_POOL_ID=$identityPoolId
"@ | Out-File -Encoding utf8 $envPath

Write-Host "Wrote: $envPath"

# --- Build UI ---
Write-Host "Installing UI deps..."
npm --prefix ui ci

Write-Host "Building UI..."
npm --prefix ui run build

# --- Deploy to S3 ---
$distPathA = "ui/dist"
$distPathB = "dist"

$distPath = $null
if (Test-Path $distPathA) { $distPath = $distPathA }
elseif (Test-Path $distPathB) { $distPath = $distPathB }
else { throw "Build output not found. Expected '$distPathA' or '$distPathB'." }

Write-Host "Syncing $distPath -> s3://$uiBucket ..."
aws s3 sync $distPath "s3://$uiBucket" --delete --region $Region


# --- CloudFront invalidate ---
Write-Host "Invalidating CloudFront distribution $distId ..."
aws cloudfront create-invalidation --distribution-id $distId --paths "/*" | Out-Null

Write-Host ""
Write-Host "✅ UI deployed."
Write-Host "Open: $uiUrl"
Write-Host "Callback configured as: $uiUrl/callback"
