{ lib, ... }:

let
  mkSignerHost = import ../lib/mk-signer-host.nix { inherit lib; };
  generatedHardware = ./generated/zeko-mainnet-signer-hardware.nix;
in
mkSignerHost {
  host = {
    hostName = "zeko-mainnet-signer";
    publicHostname = "zeko-mainnet.signer.luminadex.com";
    targetEnvironment = "zeko-mainnet";
  };
  extraImports = lib.optional (builtins.pathExists generatedHardware) generatedHardware;
}
