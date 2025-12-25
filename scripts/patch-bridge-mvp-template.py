from pathlib import Path

p = Path("infra/template.yaml")
txt = p.read_text(encoding="utf-8")

# 1) Parameters: ajouter TenantAlias + UiCustomDomain + env settings (avant Conditions:)
if "TenantAlias:" not in txt:
    insert = """
  TenantAlias:
    Type: String
    Default: ad-cyberwatch-ai
    Description: Tenant alias used for runtime config.
  UiCustomDomain:
    Type: String
    Default: https://ad-cyberwatch-ai.ouritres.com
    Description: Primary UI origin (CORS + Cognito callback).
  DefaultDataEnv:
    Type: String
    Default: prod
    Description: Default selected data environment.
  EnabledDataEnvs:
    Type: String
    Default: prod,dev
    Description: Comma-separated list of enabled environments.
"""
    txt = txt.replace("\nConditions:\n", insert + "\nConditions:\n", 1)

# 2) CORS allowOrigins: ajouter UiCustomDomain
if "UiCustomDomain" in txt and "!Ref UiCustomDomain" not in txt:
    txt = txt.replace(
        "          - !Sub 'https://${UiDistribution.DomainName}'\n",
        "          - !Sub 'https://${UiDistribution.DomainName}'\n          - !Ref UiCustomDomain\n",
        1
    )

# 3) Cognito client callback/logout: ajouter UiCustomDomain
if "!Sub \"${UiCustomDomain}/callback\"" not in txt:
    txt = txt.replace(
        "        - !Sub \"https://${UiDistribution.DomainName}/callback\"\n",
        "        - !Sub \"https://${UiDistribution.DomainName}/callback\"\n        - !Sub \"${UiCustomDomain}/callback\"\n",
        1
    )
if "LogoutURLs:" in txt and "        - !Ref UiCustomDomain" not in txt:
    txt = txt.replace(
        "      LogoutURLs:\n        - http://localhost:5173\n        - !Sub \"https://${UiDistribution.DomainName}\"\n",
        "      LogoutURLs:\n        - http://localhost:5173\n        - !Sub \"https://${UiDistribution.DomainName}\"\n        - !Ref UiCustomDomain\n",
        1
    )

# 4) ApiFunction env vars: tenant/env + CORS_ALLOW_ORIGINS
if "TENANT_ALIAS:" not in txt:
    txt = txt.replace(
        "          FRAMEWORKS_BUCKET: !Ref FrameworksBucket\n",
        "          FRAMEWORKS_BUCKET: !Ref FrameworksBucket\n"
        "          TENANT_ALIAS: !Ref TenantAlias\n"
        "          DEFAULT_DATA_ENV: !Ref DefaultDataEnv\n"
        "          ENABLED_DATA_ENVS: !Ref EnabledDataEnvs\n"
        "          CORS_ALLOW_ORIGINS: !Sub \"http://localhost:5173,http://localhost:5174,https://${UiDistribution.DomainName},${UiCustomDomain}\"\n",
        1
    )

# 5) ApiFunction routes: public/config + control/* + data/{env}/uploads/presign
if "PublicConfig:" not in txt:
    txt = txt.replace(
        "        Presign:\n          Type: HttpApi\n          Properties:\n            ApiId: !Ref AdCyberwatchHttpApi\n            Path: /uploads/presign\n            Method: POST\n",
        "        Presign:\n          Type: HttpApi\n          Properties:\n            ApiId: !Ref AdCyberwatchHttpApi\n            Path: /uploads/presign\n            Method: POST\n"
        "        DataPresign:\n          Type: HttpApi\n          Properties:\n            ApiId: !Ref AdCyberwatchHttpApi\n            Path: /data/{env}/uploads/presign\n            Method: POST\n"
        "        PublicConfig:\n          Type: HttpApi\n          Properties:\n            ApiId: !Ref AdCyberwatchHttpApi\n            Path: /public/config\n            Method: GET\n            Auth:\n              Authorizer: NONE\n"
        "        ControlMe:\n          Type: HttpApi\n          Properties:\n            ApiId: !Ref AdCyberwatchHttpApi\n            Path: /control/me\n            Method: GET\n"
        "        ControlEnvironments:\n          Type: HttpApi\n          Properties:\n            ApiId: !Ref AdCyberwatchHttpApi\n            Path: /control/environments\n            Method: GET\n",
        1
    )

# 6) Output Hosted UI URL: redirect vers UiCustomDomain/callback
txt = txt.replace(
    "Value: !Sub \"https://${CognitoDomainPrefix}.auth.${AWS::Region}.amazoncognito.com/login?client_id=${AdCyberwatchUserPoolClient}&response_type=code&redirect_uri=http://localhost:5173/callback\"",
    "Value: !Sub \"https://${CognitoDomainPrefix}.auth.${AWS::Region}.amazoncognito.com/login?client_id=${AdCyberwatchUserPoolClient}&response_type=code&redirect_uri=${UiCustomDomain}/callback\""
)

p.write_text(txt, encoding="utf-8")
print("Patched infra/template.yaml")
