<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as BaseResponse;

/** Serves the built Argus SPA shell for any /argus/* path (client-side routing). */
final class SpaController extends Controller
{
    public function __invoke(): BaseResponse
    {
        $index = public_path('argus/index.html');

        if (! is_file($index)) {
            return response(
                'The Argus UI has not been built yet. Run: spin exec node npm run build',
                Response::HTTP_SERVICE_UNAVAILABLE,
            );
        }

        return response((string) file_get_contents($index));
    }
}
