{ config, lib, ... }:

let
  host = config.lumina.host;
in
{
  disko.devices.disk = lib.mkMerge [
    {
      main = {
        type = "disk";
        device = host.system.primaryDisk;
        content = {
          type = "gpt";
          partitions = {
            grub = {
              size = "1M";
              type = "EF02";
              priority = 1;
            };
            root = {
              size = "100%";
              content = {
                type = "filesystem";
                format = "ext4";
                mountpoint = "/";
              };
            };
          };
        };
      };
    }
    (lib.optionalAttrs (host.system.secondaryDisk != null) {
      secondary = {
        type = "disk";
        device = host.system.secondaryDisk;
        content = {
          type = "gpt";
          partitions = { };
        };
      };
    })
  ];
}
