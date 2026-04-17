<?php
// Pilotes Academy — Auto-deploy webhook
// Called by GitHub on every push to main

$secret = 'e1106812b9db421fd1b74ebdcb73e1994ef2d0fd6f75ddcc794fc05eca074ef8';

$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
$payload   = file_get_contents('php://input');
$expected  = 'sha256=' . hash_hmac('sha256', $payload, $secret);

if (!hash_equals($expected, $signature)) {
    http_response_code(403);
    exit('Unauthorized');
}

$event = $_SERVER['HTTP_X_GITHUB_EVENT'] ?? '';
if ($event !== 'push') {
    exit('Ignored: not a push');
}

$data = json_decode($payload, true);
if (($data['ref'] ?? '') !== 'refs/heads/main') {
    exit('Ignored: not main branch');
}

$repo   = '/home/unwm2932/repositories/skill-tracker';
$target = '/home/unwm2932/academy.les-pilotes.fr/app/';

exec("cd $repo && git pull origin main 2>&1", $git_out, $git_code);
exec("cp -Ra $repo/app/. $target 2>&1", $cp_out, $cp_code);

$log = date('Y-m-d H:i:s') . " | git: " . implode(' ', $git_out) . " | cp: " . ($cp_code === 0 ? 'OK' : 'FAIL') . "\n";
file_put_contents('/home/unwm2932/academy.les-pilotes.fr/deploy.log', $log, FILE_APPEND);

http_response_code(200);
echo json_encode(['status' => 'deployed', 'git_code' => $git_code, 'cp_code' => $cp_code]);
