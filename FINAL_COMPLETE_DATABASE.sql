-- ========================================
-- BRIFY RRHH V3 - COMPLETE DATABASE SETUP
-- Script unificado para crear TODAS las tablas
-- Ejecutar en Supabase SQL Editor
-- ========================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- 1. TABLAS CORE
-- ========================================

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    industry TEXT,
    size TEXT CHECK (size IN ('small', 'medium', 'large', 'enterprise')),
    website TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Chile',
    timezone TEXT DEFAULT 'America/Santiago',
    logo_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'trial')),
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'pro', 'enterprise')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'manager', 'user')),
    department TEXT,
    position TEXT,
    is_active BOOLEAN DEFAULT true,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
