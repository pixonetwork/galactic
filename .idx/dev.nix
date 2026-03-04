{ pkgs, ... }: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
  ];
  idx = {
    extensions = [ ];
    workspace = {
      # Runs when the workspace is first created
      onCreate = {
        npm-install = "npm install";
      };
      # Runs every time the workspace starts up
      onStart = {
        start-server = "npm start";
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "start"];
          manager = "web";
          env = {
            PORT = "$PORT";
          };
        };
      };
    };
  };
}
