{ lib }:

{
  hostName,
  publicHostname,
  targetEnvironment,
  adminKeyPath ? null,
  adminKeyEnv ? "LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY",
  extraImports ? [ ],
  extraConfig ? { },
}:

let
  readKeyOrEnv = envName: path:
    let
      fromEnv = builtins.getEnv envName;
    in
    if fromEnv != "" then
      [ fromEnv ]
    else
      lib.optional (path != null && builtins.pathExists path) (
        lib.strings.removeSuffix "\n" (builtins.readFile path)
      );
in
{
  imports = [
    ../modules/lumina-base-hardening.nix
    ../modules/lumina-caddy.nix
    ../modules/lumina-signer.nix
  ] ++ extraImports;

  config = lib.mkMerge [
    {
      # Default the hostname here so local test hosts can override it without
      # duplicating the rest of the signer host shape.
      networking.hostName = lib.mkDefault hostName;

      lumina.baseHardening = {
        enable = true;
        adminAuthorizedKeys = readKeyOrEnv adminKeyEnv adminKeyPath;
      };

      lumina.signer = {
        enable = true;
        inherit publicHostname targetEnvironment;
      };
    }
    extraConfig
  ];
}
