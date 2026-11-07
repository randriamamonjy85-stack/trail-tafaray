-- Remplir age_min / age_max d'après le barème 2026 si encore vides
update category_rules set age_min = 5,  age_max = 12  where code_base = 'ZT' and discipline = 'trail' and (age_min is null);
update category_rules set age_min = 13, age_max = 17  where code_base = 'CA' and discipline = 'trail' and (age_min is null);
update category_rules set age_min = 18, age_max = 19  where code_base = 'JU' and discipline = 'trail' and (age_min is null);
update category_rules set age_min = 20, age_max = 22  where code_base = 'ES' and discipline = 'trail' and (age_min is null);
update category_rules set age_min = 23, age_max = 32  where code_base = 'SE' and discipline = 'trail' and (age_min is null);
update category_rules set age_min = 33, age_max = 37  where code_base = 'M0' and discipline = 'trail' and (age_min is null);
update category_rules set age_min = 38, age_max = 42  where code_base = 'M1' and discipline = 'trail' and (age_min is null);
update category_rules set age_min = 43, age_max = 47  where code_base = 'M2' and discipline = 'trail' and (age_min is null);
update category_rules set age_min = 48, age_max = 52  where code_base = 'M3' and discipline = 'trail' and (age_min is null);
update category_rules set age_min = 53, age_max = 57  where code_base = 'M4' and discipline = 'trail' and (age_min is null);
update category_rules set age_min = 58, age_max = 120 where code_base = 'M5' and discipline = 'trail' and (age_min is null);

update category_rules set age_min = 18, age_max = 22  where code_base = 'ES' and discipline = 'vtt' and (age_min is null);
update category_rules set age_min = 23, age_max = 39  where code_base = 'SE' and discipline = 'vtt' and (age_min is null);
update category_rules set age_min = 40, age_max = 49  where code_base = 'V1' and discipline = 'vtt' and (age_min is null);
update category_rules set age_min = 50, age_max = 59  where code_base = 'V2' and discipline = 'vtt' and (age_min is null);
update category_rules set age_min = 60, age_max = 120 where code_base = 'V3' and discipline = 'vtt' and (age_min is null);

update category_rules set age_min = 18, age_max = 19  where code_base = 'JU' and discipline = 'duathlon' and (age_min is null);
update category_rules set age_min = 20, age_max = 22  where code_base = 'ES' and discipline = 'duathlon' and (age_min is null);
update category_rules set age_min = 23, age_max = 32  where code_base = 'SE' and discipline = 'duathlon' and (age_min is null);
update category_rules set age_min = 33, age_max = 37  where code_base = 'M0' and discipline = 'duathlon' and (age_min is null);
update category_rules set age_min = 38, age_max = 42  where code_base = 'M1' and discipline = 'duathlon' and (age_min is null);
update category_rules set age_min = 43, age_max = 47  where code_base = 'M2' and discipline = 'duathlon' and (age_min is null);
update category_rules set age_min = 48, age_max = 52  where code_base = 'M3' and discipline = 'duathlon' and (age_min is null);
update category_rules set age_min = 53, age_max = 57  where code_base = 'M4' and discipline = 'duathlon' and (age_min is null);
update category_rules set age_min = 58, age_max = 120 where code_base = 'M5' and discipline = 'duathlon' and (age_min is null);
