module.exports = {
  apps: [
    {
      name: "email-cleaner",
      script: "npm",
      args: "run start:prod",
      out_file: "./logs/out.log",
      error_file: "./logs/err.log",
      time: true,
    },
  ],
}