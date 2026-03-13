{ lib, ... }:

let
  mkSignerHost = import ../lib/mk-signer-host.nix { inherit lib; };
in
mkSignerHost {
  host = {
    hostName = "mina-mainnet-signer";
    publicHostname = "mina-mainnet.signer.luminadex.com";
    targetEnvironment = "mina-mainnet";
    system = {
      interface = "enp9s0";
      primaryDisk = "/dev/nvme0n1";
      secondaryDisk = "/dev/nvme1n1";
    };
  };
  extraImports = [
    ../modules/lumina-hetzner-ax41.nix
    ../modules/lumina-disko.nix
  ];
  extraConfig = {
    lumina.baseHardening.autoUpgradeEnable = false;
  };
}
