import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
    },
    server: {
        port: 1648, // the Taj Mahal was completed in 1648
    },
    base: '/red-minaret/',
})
