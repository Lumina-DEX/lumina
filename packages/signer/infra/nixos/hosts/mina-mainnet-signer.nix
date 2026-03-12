{ lib, ... }:

let
  mkSignerHost = import ../lib/mk-signer-host.nix { inherit lib; };
  generatedHardware = ./generated/mina-mainnet-signer-hardware.nix;
in
mkSignerHost {
  host = {
    hostName = "mina-mainnet-signer";
    publicHostname = "mina-mainnet.signer.luminadex.com";
    targetEnvironment = "mina-mainnet";
  };
  extraImports = lib.optional (builtins.pathExists generatedHardware) generatedHardware;
}
