<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;

class DeviceHash
{
    const COOKIE_NAME = 'device_hash';
    const COOKIE_LIFETIME = 525600; // 1 year in minutes

    public static function get()
    {
        $hash = Cookie::get(self::COOKIE_NAME);
        
        if (!$hash) {
            $hash = Str::random(32);
            Cookie::queue(self::COOKIE_NAME, $hash, self::COOKIE_LIFETIME);
        }
        
        return $hash;
    }
}
