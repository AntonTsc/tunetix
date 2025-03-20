<?php
    include_once '../../db.php';

    function validateType($type, $conn){
        header('Content-Type: application/json');

        $isValid = false;
        $type = strtoupper($type);

        $types = $conn->query("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'metodo_pago' AND COLUMN_NAME = 'tipo'");
        $types = $types->fetch_assoc()['COLUMN_TYPE'];
        $types = str_replace(["enum(", ")", "'"], "", $types);
        $types = explode(",", $types);
        
        foreach($types as $t){
            if($type === $t){
                $isValid = true;
                break;
            }
        }

        return $isValid;
    }

    // function validatePan($pan){
    //     if (!preg_match('/^\d{13,19}$/', $pan)) {
    //         return false;
    //     }

    //     return luhnCheck($pan);
    // }

    // Comprueba el formato del codigo PAN
    function luhnCheck($number) {
        $number = strval($number);
        $sum = 0;
        $alt = false;
        $digits = str_split(strrev($number)); // Invertir el número para procesarlo correctamente
    
        foreach ($digits as $digit) {
            $digit = (int)$digit;
            if ($alt) {
                $digit *= 2;
                if ($digit > 9) $digit -= 9; // Si es mayor a 9, restar 9 (equivalente a sumar los dígitos)
            }
            $sum += $digit;
            $alt = !$alt;
        }
    
        return $sum % 10 === 0;
    }

    function validateCvc($cvc) {
        // Verificar si el CVC tiene exactamente 3 dígitos numéricos
        return preg_match('/^\d{3}$/', $cvc);
    }

    function validateExpirationDate($expiration_date) {
        // Validar que el formato sea MM/AA
        if (!preg_match('/^(0[1-9]|1[0-2])\/\d{2}$/', $expiration_date)) {
            return false; // Formato incorrecto
        }
    
        // Extraer mes y año de la fecha
        list($month, $year) = explode('/', $expiration_date);
    
        // Obtener el año y mes actual
        $currentYear = date('y'); // Año actual en dos dígitos (por ejemplo, 25 para 2025)
        $currentMonth = date('m'); // Mes actual
    
        // Comparar el año de expiración con el año actual
        if ((int)$year < (int)$currentYear) {
            return false; // El año es menor al actual, la tarjeta está expirada
        }
    
        // Si el año de expiración es el mismo que el actual, verificar el mes
        if ((int)$year == (int)$currentYear && (int)$month < (int)$currentMonth) {
            return false; // El mes es menor al actual, la tarjeta está expirada
        }
    
        return true; // Fecha válida
    }
?>