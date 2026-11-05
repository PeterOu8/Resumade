FROM mcr.microsoft.com/dotnet/sdk:10.0.401-noble AS build
WORKDIR /src
COPY Resumade.Api.csproj packages.lock.json ./
RUN dotnet restore --locked-mode
COPY .config/dotnet-tools.json .config/dotnet-tools.json
RUN dotnet tool restore
COPY . .
RUN dotnet publish --configuration Release --no-restore --output /publish
RUN dotnet ef migrations bundle \
    --configuration Release \
    --no-build \
    --self-contained \
    --target-runtime linux-x64 \
    --output /publish/migrate

FROM mcr.microsoft.com/dotnet/aspnet:10.0.11-noble AS runtime

WORKDIR /app
RUN apt-get update \
    && apt-get install --yes --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build --chown=$APP_UID:$APP_UID /publish .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "Resumade.Api.dll"]
