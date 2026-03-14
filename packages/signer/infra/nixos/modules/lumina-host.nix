{ lib, ... }:

{
  options.lumina.host = {
    hostName = lib.mkOption {
      type = lib.types.str;
      description = "Internal NixOS hostname for the signer host.";
    };

    publicHostname = lib.mkOption {
      type = lib.types.str;
      description = "Public hostname served for the signer host.";
    };

    targetEnvironment = lib.mkOption {
      type = lib.types.enum [
        "zeko-testnet"
        "mina-mainnet"
        "zeko-mainnet"
      ];
      description = "Static deployment environment label for the signer host.";
    };

    system = {
      interface = lib.mkOption {
        type = lib.types.str;
        default = "eno1";
        description = "Primary network interface name for the host.";
      };

      primaryDisk = lib.mkOption {
        type = lib.types.str;
        default = "/dev/nvme0n1";
        description = "Primary installation disk for the host.";
      };

      secondaryDisk = lib.mkOption {
        type = lib.types.nullOr lib.types.str;
        default = "/dev/nvme1n1";
        description = "Optional secondary disk for the host.";
      };
    };
  };
}
