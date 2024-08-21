module.exports = {
  apps: [
    {
      name: "unidner-node",
      script: "./index.js",
      instances: "2",
      exec_mode: "cluster",
      instance_var: "INSTANCE_ID",
      error_file: "./storage/logs/pm2_err.log",
      out_file: "./storage/logs/pm2_out.log",
    },
  ],
};
