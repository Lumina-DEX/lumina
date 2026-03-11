{ lib, ... }:

let
  readKeyIfPresent = path:
    lib.optional (builtins.pathExists path) (lib.strings.removeSuffix "\n" (builtins.readFile path));
  generatedHardware = ./generated/mina-mainnet-signer-hardware.nix;
in
{
  imports =
    [
      ../modules/lumina-base-hardening.nix
      ../modules/lumina-caddy.nix
      ../modules/lumina-signer.nix
    ]
    ++ lib.optional (builtins.pathExists generatedHardware) generatedHardware;

  networking.hostName = "mina-mainnet-signer";

  lumina.baseHardening = {
    enable = true;
    adminUser = "lumina-admin";
    adminAuthorizedKeys = readKeyIfPresent ./keys/mina-mainnet-admin.pub;
    serviceUser = "lumina-signer-service";
    serviceAuthorizedKeys = readKeyIfPresent ./keys/mina-mainnet-service.pub;
  };

  lumina.signer = {
    enable = true;
    publicHostname = "mina-mainnet.signer.luminadex.com";
    targetEnvironment = "mina-mainnet";
  };
}
