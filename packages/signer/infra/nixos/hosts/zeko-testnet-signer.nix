{ lib, ... }:

let
  mkSignerHost = import ../lib/mk-signer-host.nix { inherit lib; };
  generatedHardware = ./generated/zeko-testnet-signer-hardware.nix;
in
mkSignerHost {
  hostName = "zeko-testnet-signer";
  publicHostname = "zeko-testnet.signer.luminadex.com";
  targetEnvironment = "zeko-testnet";
  adminKeyPath = ./keys/zeko-testnet-admin.pub;
  extraImports = lib.optional (builtins.pathExists generatedHardware) generatedHardware;
}
