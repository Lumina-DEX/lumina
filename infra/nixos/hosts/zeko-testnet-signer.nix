{ lib, ... }:

let
  readKeyIfPresent = path:
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
    adminUser = "lumina-admin";
    adminAuthorizedKeys = readKeyIfPresent ./keys/zeko-testnet-admin.pub;
    serviceUser = "lumina-signer-service";
    serviceAuthorizedKeys = readKeyIfPresent ./keys/zeko-testnet-service.pub;
  };

  lumina.signer = {
    enable = true;
    publicHostname = "zeko-testnet.signer.luminadex.com";
    targetEnvironment = "zeko-testnet";
  };
}
