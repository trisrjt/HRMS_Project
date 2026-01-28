<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class ServeFull extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'serve:full {--skip-build : Skip the frontend build step}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Build the React frontend and start the Laravel development server';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->option('skip-build')) {
            $this->info('Building React frontend...');
            $this->newLine();

            $frontendPath = base_path('../frontend-react');
            
            if (!is_dir($frontendPath)) {
                $this->error('Frontend directory not found at: ' . $frontendPath);
                return 1;
            }

            // Build the frontend
            $process = new Process(['npm', 'run', 'build:laravel'], $frontendPath);
            $process->setTimeout(300); // 5 minutes timeout
            
            $process->run(function ($type, $buffer) {
                echo $buffer;
            });

            if (!$process->isSuccessful()) {
                $this->error('Frontend build failed!');
                return 1;
            }

            $this->newLine();
            $this->info('✓ Frontend build complete!');
            $this->newLine();
        } else {
            $this->info('Skipping frontend build...');
            $this->newLine();
        }

        $this->info('Starting Laravel development server...');
        $this->newLine();

        // Start the Laravel server
        $this->call('serve');

        return 0;
    }
}
