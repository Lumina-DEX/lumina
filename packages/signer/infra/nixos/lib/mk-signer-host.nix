{ lib }:

{
  host,
  adminKeyEnv ? "LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY",
  extraImports ? [ ],
  extraConfig ? { },
}:

let
  adminKeyFromEnv = builtins.getEnv adminKeyEnv;
in
{
  imports = [
    ../modules/lumina-host.nix
    ../modules/lumina-base-hardening.nix
    ../modules/lumina-caddy.nix
    ../modules/lumina-signer.nix
  ] ++ extraImports;

  config = lib.mkMerge [
    {
      # Default the hostname here so local test hosts can override it without
      # duplicating the rest of the signer host shape.
      networking.hostName = lib.mkDefault host.hostName;

      lumina.host = host;

      lumina.baseHardening = {
        enable = true;
        adminAuthorizedKeys = lib.optional (adminKeyFromEnv != "") adminKeyFromEnv;
      };

      lumina.signer = {
        enable = true;
        inherit (host) publicHostname targetEnvironment;
      };
    }
    extraConfig
  ];
}
