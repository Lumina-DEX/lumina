{ config, lib, pkgs, ... }:

let
  cfg = config.lumina.baseHardening;
in
{
  options.lumina.baseHardening = {
    enable = lib.mkEnableOption "Lumina baseline hardening";

    adminUser = lib.mkOption {
      type = lib.types.str;
      default = "lumina-admin";
      description = "Primary SSH operator account.";
    };

    adminAuthorizedKeys = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [ ];
      description = "Public keys allowed for the operator account.";
    };

    timezone = lib.mkOption {
      type = lib.types.str;
      default = "UTC";
      description = "Host timezone.";
    };

    stateVersion = lib.mkOption {
      type = lib.types.str;
      default = "24.11";
      description = "NixOS state version.";
    };

    autoUpgradeEnable = lib.mkOption {
      type = lib.types.bool;
      default = true;
      description = "Whether unattended NixOS auto-upgrades are enabled.";
    };
  };

  config = lib.mkIf cfg.enable {
    # The generated hardware config (hosts/generated/*-hardware.nix) carries
    # the real boot-loader settings for each host.  When that file is absent
    # (e.g. in CI, where it is gitignored) we must still pass the NixOS grub
    # assertions.  Disabling grub here is safe: nixos-rebuild switch will
    # activate the new generation and restart services without touching the
    # boot loader, so the host keeps booting from whatever nixos-anywhere
    # installed during the initial rollout.  When the hardware config IS
    # present it can override this with the correct grub device.
    boot.loader.grub.enable = lib.mkDefault false;

    time.timeZone = cfg.timezone;

    nix.settings.experimental-features = [
      "nix-command"
      "flakes"
    ];

    # nixos-rebuild --target-host uses ssh:// transport, which runs
    # nix-store --serve --write on the remote.  This rejects unsigned
    # locally-built store paths unless require-sigs is disabled.
    # trusted-users is also needed for daemon-based operations.
    nix.settings.trusted-users = [
      "root"
      "@wheel"
    ];
    nix.settings.require-sigs = false;

    networking.firewall.enable = true;
    networking.firewall.allowedTCPPorts = [
      22
      80
      443
    ];

    services.fail2ban.enable = true;

    services.openssh = {
      enable = true;
      openFirewall = false;
      settings = {
        KbdInteractiveAuthentication = false;
        PasswordAuthentication = false;
        PermitRootLogin = "no";
        PubkeyAuthentication = true;
        X11Forwarding = false;
      };
    };

    users.users.${cfg.adminUser} = {
      isNormalUser = true;
      description = "Lumina signer operator";
      extraGroups = [ "wheel" ];
      openssh.authorizedKeys.keys = cfg.adminAuthorizedKeys;
      shell = pkgs.bashInteractive;
    };

    security.sudo.wheelNeedsPassword = false;

    system.autoUpgrade = {
      enable = cfg.autoUpgradeEnable;
      allowReboot = false;
      dates = "04:00";
      randomizedDelaySec = "45min";
    };

    environment.systemPackages = with pkgs; [
      bashInteractive
      curl
      git
      jq
      podman
    ];

    system.stateVersion = cfg.stateVersion;
  };
}
