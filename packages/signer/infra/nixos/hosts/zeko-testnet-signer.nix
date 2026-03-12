{ lib, ... }:

let
  mkSignerHost = import ../lib/mk-signer-host.nix { inherit lib; };
  generatedHardware = ./generated/zeko-testnet-signer-hardware.nix;
in
mkSignerHost {
  host = {
    hostName = "zeko-testnet-signer";
    publicHostname = "zeko-testnet.signer.luminadex.com";
    targetEnvironment = "zeko-testnet";
  };
  extraImports = lib.optional (builtins.pathExists generatedHardware) generatedHardware;
}
