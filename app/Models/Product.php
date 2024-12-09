<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'brand',
        'category',
        'type',
        'collectionId',
        'collectionName',
        'featured',
        'image',
        'images',
        'isAvailable',
        'metadata',
        'variants'
    ];

    protected $casts = [
        'images' => 'array',
        'metadata' => 'array',
        'variants' => 'array',
        'featured' => 'boolean',
        'isAvailable' => 'boolean'
    ];

    public function setNameAttribute($value)
    {
        $this->attributes['name'] = $value;
        $this->attributes['slug'] = \Str::slug($value);
    }
}
