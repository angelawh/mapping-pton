# -*- coding: utf-8 -*-
# Generated by Django 1.10.6 on 2017-03-22 06:00
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('mapper', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Bathroom',
            fields=[
                ('room_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='mapper.Room')),
                ('gender', models.CharField(choices=[('M', 'Male'), ('F', 'Female'), ('N', 'Neutral')], max_length=1)),
            ],
            bases=('mapper.room',),
        ),
        migrations.CreateModel(
            name='Printer',
            fields=[
                ('room_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='mapper.Room')),
                ('color', models.BooleanField(default=False)),
            ],
            bases=('mapper.room',),
        ),
        migrations.AlterField(
            model_name='prof',
            name='room',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='mapper.Room'),
        ),
        migrations.AlterField(
            model_name='room',
            name='number',
            field=models.CharField(max_length=25, null=True),
        ),
        migrations.AlterField(
            model_name='student',
            name='room',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='mapper.Room'),
        ),
    ]
