{ lib, ... }:

{
  # This module is only for local verification inside an OrbStack NixOS
  # machine. It reuses OrbStack's own guest configuration instead of pretending
  # the VM is a bare-metal target.
  imports = [
    /etc/nixos/configuration.nix
  ];

  # OrbStack disables sshd in its generated config. The signer host profile is
  # meant to manage SSH itself, so local verification needs to re-enable it.
  services.openssh.enable = lib.mkForce true;
}
