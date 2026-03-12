{ lib, ... }:

let
  mkSignerHost = import ../lib/mk-signer-host.nix { inherit lib; };
  generatedHardware = ./generated/mina-mainnet-signer-hardware.nix;
in
mkSignerHost {
  hostName = "mina-mainnet-signer";
  publicHostname = "mina-mainnet.signer.luminadex.com";
  targetEnvironment = "mina-mainnet";
  adminKeyPath = ./keys/mina-mainnet-admin.pub;
  extraImports = lib.optional (builtins.pathExists generatedHardware) generatedHardware;
}
