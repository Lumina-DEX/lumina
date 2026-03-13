{
  description = "Lumina signer NixOS hosts";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    disko.url = "github:nix-community/disko";
    disko.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { self, nixpkgs, disko, ... }:
    let
      inherit (nixpkgs) lib;
      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ];
      hostDefinitions = import ./lib/host-definitions.nix;
      mkHost = host:
        nixpkgs.lib.nixosSystem {
          inherit (host) system;
          modules = [
            disko.nixosModules.disko
            host.module
          ];
        };
    in
    {
      nixosModules = {
        lumina-host = import ./modules/lumina-host.nix;
        lumina-base-hardening = import ./modules/lumina-base-hardening.nix;
        lumina-caddy = import ./modules/lumina-caddy.nix;
        lumina-disko = import ./modules/lumina-disko.nix;
        lumina-hetzner-ax41 = import ./modules/lumina-hetzner-ax41.nix;
        lumina-signer = import ./modules/lumina-signer.nix;
      };

      nixosConfigurations = lib.mapAttrs (_: mkHost) hostDefinitions;

      formatter = nixpkgs.lib.genAttrs systems (system: nixpkgs.legacyPackages.${system}.nixfmt-rfc-style);
    };
}
