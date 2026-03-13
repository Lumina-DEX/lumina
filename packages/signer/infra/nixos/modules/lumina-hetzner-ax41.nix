{ config, lib, ... }:

let
  host = config.lumina.host;
in
{
  config = {
    # AX41-NVMe hosts use the same storage and kernel profile across the signer
    # fleet, so keep it in one place instead of regenerating per-host files.
    boot.initrd.availableKernelModules = [
      "ahci"
      "xhci_pci"
      "nvme"
    ];
    boot.kernelModules = [ "kvm-amd" ];

    boot.loader.grub = {
      enable = true;
    };

    hardware.cpu.amd.updateMicrocode = lib.mkDefault config.hardware.enableRedistributableFirmware;
    hardware.enableRedistributableFirmware = lib.mkDefault true;

    networking.useDHCP = lib.mkDefault true;
    systemd.network.wait-online.ignoredInterfaces = [ "lo" ];

    assertions = [
      {
        assertion = lib.hasPrefix "/dev/nvme" host.system.primaryDisk;
        message = "AX41-NVMe hosts must use an NVMe primary disk.";
      }
    ];
  };
}
