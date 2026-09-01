<!DOCTYPE html>
<html>
<head>
    <title>Invitation to join SACCO</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h2>You have been invited!</h2>
    <p>You have been invited to join <strong>{{ $invitation->sacco->name }}</strong>.</p>
    <p>Please click the button below to complete your registration. This link will expire on {{ $invitation->expires_at->format('M d, Y') }}.</p>
    
    <div style="margin: 30px 0;">
        <a href="{{ $registrationUrl }}" style="background-color: #0B6B3A; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Complete Registration
        </a>
    </div>

    <p>If you have any questions, please contact your SACCO administrator.</p>
    <p>Thanks,<br>The SACCO Management Team</p>
</body>
</html>
