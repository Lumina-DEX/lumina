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
      description = "Primary operator account for the host.";
    };

    adminAuthorizedKeys = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [ ];
      description = "SSH public keys allowed for the operator account.";
    };

    serviceUser = lib.mkOption {
      type = lib.types.str;
      default = "lumina-signer-service";
      description = "Deployment account used by CI and release operators.";
    };

    serviceAuthorizedKeys = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [ ];
      description = "SSH public keys allowed for the deployment account.";
    };

    timezone = lib.mkOption {
      type = lib.types.str;
      default = "UTC";
      description = "Host timezone.";
    };

    stateVersion = lib.mkOption {
      type = lib.types.str;
      default = "24.11";
      description = "NixOS state version for new hosts.";
    };
  };

  config = lib.mkIf cfg.enable {
    time.timeZone = cfg.timezone;

    nix.settings.experimental-features = [
      "nix-command"
      "flakes"
    ];

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

    users.users.${cfg.serviceUser} = {
      isNormalUser = true;
      description = "Lumina signer deploy user";
      openssh.authorizedKeys.keys = cfg.serviceAuthorizedKeys;
      shell = pkgs.bashInteractive;
    };

    security.sudo.wheelNeedsPassword = true;

    system.autoUpgrade = {
      enable = true;
      allowReboot = false;
      dates = "04:00";
      randomizedDelaySec = "45min";
      flags = [ "--upgrade-all" ];
    };

    environment.systemPackages = with pkgs; [
      bashInteractive
      curl
      git
      jq
      openssl
    ];

    system.stateVersion = cfg.stateVersion;
  };
}
