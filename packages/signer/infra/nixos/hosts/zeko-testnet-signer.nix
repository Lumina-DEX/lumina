{ lib, ... }:

let
  readKeyOrEnv = envName: path:
    let
      fromEnv = builtins.getEnv envName;
    in
      if fromEnv != "" then
        [ fromEnv ]
      else
        lib.optional (builtins.pathExists path) (lib.strings.removeSuffix "\n" (builtins.readFile path));
  generatedHardware = ./generated/zeko-testnet-signer-hardware.nix;
in
{
  imports =
    [
      ../modules/lumina-base-hardening.nix
      ../modules/lumina-caddy.nix
      ../modules/lumina-signer.nix
    ]
    ++ lib.optional (builtins.pathExists generatedHardware) generatedHardware;

  networking.hostName = "zeko-testnet-signer";

  lumina.baseHardening = {
    enable = true;
    adminAuthorizedKeys = readKeyOrEnv "LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY" ./keys/zeko-testnet-admin.pub;
  };

  lumina.signer = {
    enable = true;
    publicHostname = "zeko-testnet.signer.luminadex.com";
    targetEnvironment = "zeko-testnet";
  };
}
