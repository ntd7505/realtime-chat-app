alter table users
alter column avatar_url type varchar(1000);

alter table users
    add column avatar_public_id varchar(255);