'use client';

import { useState } from 'react';
import { migrateExistingUsers } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database } from 'lucide-react';

export default function MigratePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleMigrate = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      const migrationResult = await migrateExistingUsers();
      setResult(migrationResult);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              User Migration Tool
            </CardTitle>
            <CardDescription>
              This tool updates existing users who created groups to have the proper groupId and role fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What this does:</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Finds all users who created groups</li>
                <li>Adds missing groupId field to those users</li>
                <li>Sets their role to 'admin'</li>
                <li>Fixes the "No Group Found" issue</li>
              </ul>
            </div>

            <Button 
              onClick={handleMigrate} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Migration...
                </>
              ) : (
                'Run Migration'
              )}
            </Button>

            {result && (
              <div className={`p-4 rounded-lg ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <h3 className={`font-semibold mb-2 ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? 'Migration Successful!' : 'Migration Failed'}
                </h3>
                {result.success ? (
                  <p className="text-green-700">
                    Updated {result.updatedCount} users with groupId and role fields.
                  </p>
                ) : (
                  <p className="text-red-700">
                    Error: {result.error}
                  </p>
                )}
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p>After running the migration, log out and log back in to see the updated user data.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
