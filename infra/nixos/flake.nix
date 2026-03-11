{
  description = "Lumina signer NixOS hosts";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
  };

  outputs = { self, nixpkgs, ... }:
    let
      system = "x86_64-linux";
      mkHost = module:
        nixpkgs.lib.nixosSystem {
          inherit system;
          modules = [ module ];
        };
    in
    {
      nixosModules = {
        lumina-base-hardening = import ./modules/lumina-base-hardening.nix;
        lumina-caddy = import ./modules/lumina-caddy.nix;
        lumina-signer = import ./modules/lumina-signer.nix;
      };

      nixosConfigurations = {
        zeko-testnet-signer = mkHost ./hosts/zeko-testnet-signer.nix;
        mina-mainnet-signer = mkHost ./hosts/mina-mainnet-signer.nix;
        zeko-mainnet-signer = mkHost ./hosts/zeko-mainnet-signer.nix;
      };

      formatter.${system} = nixpkgs.legacyPackages.${system}.nixfmt-rfc-style;
    };
}
