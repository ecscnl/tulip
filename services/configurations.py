#!/usr/bin/env python
# -*- coding: utf-8 -*-

# This file is part of Flower.
#
# Copyright ©2018 Nicolò Mazzucato
# Copyright ©2018 Antonio Groza
# Copyright ©2018 Brunello Simone
# Copyright ©2018 Alessio Marotta
# DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
# 
# Flower is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# Flower is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Flower.  If not, see <https://www.gnu.org/licenses/>.

import re
import os

mongo_host = os.getenv("TULIP_MONGO", "0.0.0.0:27017")
mongo_server = f'mongodb://{mongo_host}/'
vm_ip = "10.60.4.1"  # todo put regex

services = [{"ip": vm_ip, "port": 5000, "name": "Trademark"},
            {"ip": vm_ip, "port": 1337, "name": "RPN"},
            {"ip": vm_ip, "port": 3003, "name": "closedsea"},
            {"ip": vm_ip, "port": 3004, "name": "closedseaMinter"},
            {"ip": vm_ip, "port": 1234, "name": "CyberUniAuth"},
            {"ip": vm_ip, "port": 1235, "name": "ExamNotes"},
            {"ip": vm_ip, "port": 1236, "name": "EncryptedNotes"},
            {"ip": vm_ip, "port": 1237, "name": "ExamPortal"},
]

def containsFlag(text):
    # todo implementare logica contains
    regex_flag = os.getenv("REACT_APP_FLAG_REGEX", r'[A-Z0-9]{31}=')
    match = re.match(regex_flag, text)
    return match
