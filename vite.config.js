import{defineConfig}from'vite';import react from'@vitejs/plugin-react';export default defineConfig({base:process.env.GITHUB_ACTIONS?'/opg-time-n-leave-tracker/':'/',plugins:[react()]})
